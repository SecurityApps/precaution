// Copyright 2018 VMware, Inc.
// SPDX-License-Identifier: BSD-2-Clause

const config = {
  cleanupAfterRun: true,
  compareAgainstBaseline: false,
  fileExtensions: ['.py', '.pyw', '.go'],
  checkRunName: 'Frisk',
  noIssuesResultTitle: 'No issues found',
  noIssuesResultSummary: 'There were no issues found.',
  issuesFoundResultTitle: 'Issues found'
}

module.exports = config
