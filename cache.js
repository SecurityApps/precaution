// Copyright 2018 VMware, Inc.
// SPDX-License-Identifier: BSD-2-Clause

const fs = require('fs-extra')
const path = require('path')

/**
 * Get the cache path for this PR branch tag
 * @param {number} repoID repository identifier
 * @param {number} prID pull request identifier
 * @param {string} branchTag branch name
 */
function getBranchPath (repoID, prID, branchTag) {
  return path.join('cache', repoID.toString(), prID.toString(), branchTag)
}

/**
 * Check whether the cache directory for this branch exists
 * @param {number} repoID repository identifier
 * @param {number} prID pull request identifier
 * @param {string} branchTag branch name
 */
function branchPathExists (repoID, prID, branchTag) {
  return fs.existsSync(getBranchPath(repoID, prID, branchTag))
}

/**
 * Save a file to local PR cache, distinguish by revision
 * @param {number} repoID unique repository identifier
 * @param {number} prID unique pull request identifier
 * @param {string} branchTag a tag to identify the current file revision
 * @param {string} filePath relative file path
 * @param {any} data file data
 */
function saveFileToPRCache (repoID, prID, branchTag, filePath, data) {
  writeFileCreateDirs(path.join('cache', repoID.toString(), prID.toString(), branchTag, filePath), data)
}

/**
 * Delete pr cache folder
 * @param {number} repoID repository identifier
 * @param {number} prID pull request identifier
 */
function clearPRCache (repoID, prID) {
  fs.removeSync(path.join('cache', repoID.toString(), prID.toString()))
}

/**
 * Save a file to a specific location and create required directories
 * @param {string} filePath path to file relative to main directory
 * @param {string} data file contents
 */
function writeFileCreateDirs (filePath, data) {
  fs.mkdirpSync(path.dirname(filePath))
  fs.writeFileSync(filePath, data)
}

module.exports.getBranchPath = getBranchPath
module.exports.branchPathExists = branchPathExists
module.exports.saveFile = saveFileToPRCache
module.exports.clear = clearPRCache
