// Copyright 2018 VMware, Inc.
// SPDX-License-Identifier: BSD-2-Clause

const runBandit = require('./bandit/bandit')
const generateOutput = require('./bandit/bandit_report')
const cache = require('./cache')
const { config } = require('./config')
const apiHelper = require('./github_api_helper')

const rawMediaType = 'application/vnd.github.v3.raw'

/**
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  app.log('Starting app')

  app.on('check_suite', async context => {
    const action = context.payload.action
    const checkSuite = context.payload.check_suite
    const headSha = checkSuite.head_sha
    const pullRequests = checkSuite.pull_requests

    if (action === 'requested') {
      // Check suite is requested when code is pushed to the repository
      // TODO: investigate GitHub editor not triggering check suite
      if (pullRequests.length > 0) {
        // Commit was pushed to a PR branch
        await runLinterFromPRData(pullRequests, context, headSha)
      }

      // Ignore push events not linked to a pull request
    } else if (action === 'rerequested') {
      // Check suite was manually rerequested by a user on the checks dashboard
      // (previous run didn't complete)
      await runLinterFromPRData(pullRequests, context, headSha)
    }
  })

  app.on(['pull_request.opened', 'pull_request.reopened'], async context => {
    // Same thing but have to intercept the event because check suite is not triggered
    const pullRequest = context.payload.pull_request
    const headSha = pullRequest.head.sha

    await runLinterFromPRData([pullRequest], context, headSha)
  })
}

/**
 * Retrive files modified by pull request(s), run linter and send results
 * @param {any[]} pullRequests
 * @param {import('probot').Context} context
 * @param {string} headSha
 */
async function runLinterFromPRData (pullRequests, context, headSha) {
  const { owner, repo } = context.repo()

  // Send in progress status to Github
  const checkRunResponse = apiHelper.inProgressAPIresponse(owner, repo, headSha, context)

  try {
    // Process all pull requests associated with check suite
    const PRsDownloadedPromise = pullRequests.map(pr => processPullRequest(pr, context))
    const resolvedPRs = await Promise.all(PRsDownloadedPromise)

    // For now only deal with one PR
    const PR = pullRequests[0]

    const inputFiles = resolvedPRs[0]

    let banditResults
    // Only run baseline scan if the directory exists (spawn will crash if working directory doesn't exist)
    if (config.compareAgainstBaseline && cache.branchPathExists(PR.id, 'base')) {
      const baselineFile = '../baseline.json'
      await runBandit(cache.getBranchPath(PR.id, 'base'), inputFiles, { reportFile: baselineFile })
      banditResults = await runBandit(cache.getBranchPath(PR.id, 'head'), inputFiles, { baselineFile })
    } else {
      banditResults = await runBandit(cache.getBranchPath(PR.id, 'head'), inputFiles)
    }
    const output = generateOutput(banditResults, cache.getBranchPath(PR.id, 'head'))

    const resolvedCheckRunResponse = await checkRunResponse
    const runID = resolvedCheckRunResponse.data.id
    // Send results using the octokit APIrunID
    apiHelper.sendResults(owner, repo, runID, context, output)

    if (config.cleanupAfterRun) {
      cache.clear(PR.id)
    }
  } catch (err) {
    context.log.error(err)

    const resolvedCheckRunResponse = await checkRunResponse
    const runID = resolvedCheckRunResponse.data.id
    // Send error to GitHub
    apiHelper.errorResponse(owner, repo, context, runID, err)
  }
}

/**
 * Retrieve list of files modified by PR and download them to cache
 * @param {import('probot').Context} context
 * @returns {Promise<string[]>} Paths to the downloaded PR files
 */
async function processPullRequest (pullRequest, context) {
  const { owner, repo } = context.repo()
  const number = pullRequest.number
  const ref = pullRequest.head.ref
  const baseRef = pullRequest.base.ref
  const id = pullRequest.id

  // See https://developer.github.com/v3/pulls/#list-pull-requests-files
  // TODO: Support pagination for >30 files (max 300)
  const response = await context.github.pullRequests.getFiles({ owner, repo, number })

  const filesDownloadedPromise = response.data
    .filter(file => config.fileExtensions.reduce((acc, ext) => acc || file.filename.endsWith(ext), false))
    .filter(async fileJSON => fileJSON !== 'deleted')
    .map(async fileJSON => {
      const filename = fileJSON.filename
      const status = fileJSON.status

      // See https://developer.github.com/v3/repos/contents/#get-contents
      const headFileResp = await context.github.repos.getContent({
        owner,
        repo,
        path: filename,
        ref,
        headers: { accept: rawMediaType } })
      cache.saveFile(id, 'head', filename, headFileResp.data)

      if (config.compareAgainstBaseline && status === 'modified') {
        const baseFileResp = await context.github.repos.getContent({
          owner,
          repo,
          path: filename,
          ref: baseRef,
          headers: { accept: rawMediaType } })
        cache.saveFile(id, 'base', filename, baseFileResp.data)
      }

      return filename
    })

  // Wait until all files have been downloaded
  return Promise.all(filesDownloadedPromise)
}
