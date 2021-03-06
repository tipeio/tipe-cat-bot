const { lint, load } = require('@commitlint/core')
const getConfig = require('./get-config')

// paginate all pr commits
async function lintCommits(context) {
  const pull = context.issue()
  const { paginate, pullRequests} = context.github
  let lintStatus
  const config = await getConfig(context);

  await paginate(pullRequests.getCommits(pull), async ({ data }) => {
    // create an empty summary
    const report = { valid: true, commits: [] }

    const { rules } = await load(config)
    // error and warning counters
    let errorCount = 0
    let warningCount = 0

    // loop through all of the commits
    for (var d of data) {
      const { valid, errors, warnings } = await lint(d.commit.message, rules)
      if (!valid) {
        report.valid = false
      }

      if (errors.length > 0 || warnings.length > 0) {
        errorCount += errors.length
        warningCount += warnings.length

        report.commits.push({ sha: d.sha, errors, warnings })
      }
    }
    // create the final status
    lintStatus = {
      state: report.valid ? 'success' : 'failure',
      report,
      emojiStatus: report.valid ? '✅' : '❌',
      errSum: `Found ${errorCount} problems, and ${warningCount} warnings.`
    }
  })

  return lintStatus
}

module.exports = lintCommits
