// Copyright 2018 VMware, Inc.
// SPDX-License-Identifier: BSD-2-Clause

const { config } = require('../config')
const { getAnnotation } = require('./gosec_annotations')

function customSummary (gosecAnnotations) {
  let severityHigh = 0
  let severityMedium = 0
  let severityLow = 0

  for (let i = 0; i < gosecAnnotations.length; ++i) {
    switch (gosecAnnotations[i].severity) {
      case 'HIGH' : severityHigh += 1; break
      case 'MEDIUM' : severityMedium += 1; break
      case 'LOW' : severityLow += 1
    }
  }

  const summary = {
    'SEVERITY_HIGH': severityHigh,
    'SEVERITY_MEDIUM': severityMedium,
    'SEVERITY_LOW': severityLow
  }
  return summary
}

/**
 *
 * @param {*} results results gosec json output
 * @param {*} directory working directory for Gosec process
 */
module.exports = (results, directory) => {
  let title, summary, annotations
  if (results && results.Issues.length !== 0) {
    title = config.issuesFoundResultTitle
    summary = customSummary(results.Issues)
    annotations = results.Issues.map(issue => getAnnotation(issue, directory))
  } else {
    title = config.noIssuesResultTitle
    summary = config.noIssuesResultSummary
  }

  return { title, summary, annotations }
}
