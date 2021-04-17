import { afterUpdate } from 'svelte'
import { writable, get } from 'svelte/store'
import { valuesForm, fieldsStore } from '../lib/stores.js'
import * as CoreRules from './rules'

/**
 * Validation fields.
 * @param {object fields to validate} fn
 * @param {default fields with config} storeValues
 */
function validateFields (fn, storeValues) {
  let fields = fn.call()
  // let fields = get(fieldsStore)
  let valid = true
  let values = {}

  Object.keys(fields).map(key => {
    const field = fields[key]
    if (field.rules) {
      const statusObjField = validate(field)
      fields[key] = { ...fields[key], ...statusObjField }
      if (statusObjField.validation.errors.length > 0) {
        valid = false
      }
    } else {
      fields[key] = {
        ...fields[key],
        validation: { errors: [], dirty: false }
      }
    }

    values = { ...values, [field.name]: field.value }
  })

  // fields = { fields, values, valid }
  console.log(`fields`, fields)
  fieldsStore.set(fields)
  storeValues.set({ fields, values, valid })
}

/**
 * Validate field by rule.
 * @param {configs field} field
 */
function validate (field) {
  const { value, rules } = field
  let valid = true
  let rule
  let errors = []

  rules.map(validator => {
    // For file type.
    if (validator === 'file') {
      if (value) {
        Object.keys(value).map(i => {
          Object.keys(field.file).map(r => {
            valid = rules[r].call(null, value[i], field.file[r])
            if (!valid) {
              errors = [...errors, r]
            }
          })
        })
      }
    } else {
      // For custom rule.
      if (typeof validator === 'function') {
        valid = validator.call()
        rule = validator.name
      } else {
        const args = validator.split(/:/g)
        rule = args.shift()
        valid = CoreRules[rule].call(null, value, args)
      }
      if (!valid) {
        errors = [...errors, rule]
      }
    }
  })

  const data = { ...field, validation: { errors, dirty: errors.length > 0 } };
  console.log(`data`, data)
  return data;
}

/**
 * Validate fields form and store status.
 * @param {object fields to validate} fn
 */
export function validator (fn) {
  const storeValues = writable({ fields: [], values: {}, valid: true })
  afterUpdate(() => validateFields(fn, storeValues))
  return storeValues
}
