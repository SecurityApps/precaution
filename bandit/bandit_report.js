// Copyright 2018 VMware, Inc.
// SPDX-License-Identifier: BSD-2-Clause

function annotation (issue) {
  const path = issue.filename
  const startLine = issue.line_number
  const endLine = issue.line_number
  const annotationLevel = 'warning'
  const title = `${issue.test_id}:${issue.test_name}`
  const message = issue.issue_text

  return {
    path,
    start_line: startLine,
    end_line: endLine,
    annotation_level: annotationLevel,
    title,
    message
  }
}

/**
 * Convert bandit output into valid 'output' object for check run conclusion
 * @param {any} results Bandit json output
 */
module.exports = (results) => {
  let title, summary, annotations

  if (results) {
    results = results || { results: [] }
    title = 'Frisk security linter'
    summary = JSON.stringify(results.metrics || 'N/A', null, '\n')
    annotations = results.results.map(issue => annotation(issue))
  }

  if (!annotations || annotations.length === 0) {
    title = 'Frisk security linter'
    summary = 'All clear. \n There are no security issues found.'
  }

  return { title, summary, annotations }
}
