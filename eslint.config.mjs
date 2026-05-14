import nextBase from 'eslint-config-next'
import coreWebVitals from 'eslint-config-next/core-web-vitals'
import tsConfig from 'eslint-config-next/typescript'

/** @type {import('eslint').Linter.Config[]} */
export default [...nextBase, ...coreWebVitals, ...tsConfig]
