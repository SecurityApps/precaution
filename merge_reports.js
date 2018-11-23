// Copyright 2018 VMware, Inc.
// SPDX-License-Identifier: BSD-2-Clause

const { config } = require('./config')

module.exports = (banditReport, gosecReport) => {
  let title, summary
  let annotations = []

  if (banditReport.title === config.noIssuesResultTitle && banditReport.title === gosecReport.title) {
    title = config.noIssuesResultTitle
  } else {
    title = config.issuesFoundResultTitle
  }

  summary = '\n' + 'Gosec summary: \n' + gosecReport.summary + '\n \n' +
                                '-----------------------------------------------------------------' +
                                '\nBandit summuary' + '\n' + banditReport.summary

  annotations = annotations.concat(gosecReport.annotations, banditReport.annotations)

  return { title, summary, annotations }
}
