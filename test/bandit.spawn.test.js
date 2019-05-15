// Copyright 2018 VMware, Inc.
// SPDX-License-Identifier: BSD-2-Clause

const fs = require('fs-extra')

const { run } = require('../runner')
const { config } = require('../config')
const Bandit = require('../linters/bandit/bandit')

function bandit (dir, files) {
  return run(new Bandit(), dir, files)
}

describe('Bandit runner', () => {
  test('Finds issues in vulnerable file', async () => {
    const report = await bandit('test/fixtures/python', ['mix.vulnerable.py'])

    expect(report.annotations.length).toEqual(4)
    expect(report.annotations[0].start_line).toEqual(8)
    expect(report.annotations[1].start_line).toEqual(11)
    expect(report.annotations[2].start_line).toEqual(13)
    expect(report.annotations[3].start_line).toEqual(15)
  })

  test('Passes on safe file', async () => {
    const report = await bandit('test/fixtures/python', ['mix.safe.py'])

    expect(report.annotations.length).toEqual(0)
  })

  test('Handles empty input', async () => {
    const report = await bandit('test/fixtures/python', [])

    expect(report.annotations.length).toEqual(0)
  })

  test('Handles invalid python file with syntax errors', async () => {
    const report = await bandit('test/fixtures/python', ['sum.invalid.py'])

    expect(report.annotations.length).toBe(1)
    expect(report.annotations[0].path).toEqual('sum.invalid.py')
    expect(report.annotations[0].start_line).toBe(1)
    expect(report.annotations[0].annotation_level).toBe('failure')
    expect(report.annotations[0].title).toBe(config.syntaxErrorTitle)
  })

  afterEach(() => {
    fs.remove('test/fixtures/bandit_output.json')
  })
})
