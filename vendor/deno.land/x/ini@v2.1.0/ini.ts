import * as eol from 'https://deno.land/std@0.51.0/fs/eol.ts'

const isWindows = Deno.build.os == "windows";
const EOL = isWindows ? eol.EOL.CRLF : eol.EOL.LF;

export const parse = decode
export const stringify = encode

export interface EncodeOptions {
  section?: string,
  whitespace?: boolean
}

/**
 * Encode the object `object` into an ini-style formatted string. If the
 * optional parameter `section` is given, then all top-level properties
 * of the object are put into this section and the `section`-string is
 * prepended to all sub-sections, see the usage example above.
 * 
 * The `options` object may contain the following:
 * - `section` A string which will be the first `section` in the encoded
 *   ini data.  Defaults to none.
 * - `whitespace` Boolean to specify whether to put whitespace around the
 *   `=` character.  By default, whitespace is omitted, to be friendly to
 *   some persnickety old parsers that don't tolerate it well.  But some
 *   find that it's more human-readable and pretty with the whitespace.
 * 
 * For backwards compatibility reasons, if a `string` options is passed,
 * then it is assumed to be the `section` value.
 * 
 * @param obj Object to encode
 * @param opt Encoding options
 */
export function encode (obj: any, opt: string | EncodeOptions = { whitespace: false }) {
  const children = [] as string[]
  let out = ''
  let options = typeof opt === 'string' ? { section: opt, whitespace: false } : opt

  const separator = options.whitespace ? ' = ' : '='

  Object.keys(obj).forEach(function (k, _, __) {
    const val = obj[k]
    if (val && Array.isArray(val)) {
      val.forEach(function (item) {
        out += safe(k + '[]') + separator + safe(item) + EOL
      })
    } else if (val && typeof val === 'object') {
      children.push(k)
    } else {
      out += safe(k) + separator + safe(val) + EOL
    }
  })

  if (options.section && out.length) {
    out = '[' + safe(options.section) + ']' + EOL + out
  }

  children.forEach(function (k, _, __) {
    const nk = dotSplit(k).join('\\.')
    const section = (options.section ? options.section + '.' : '') + nk
    const child = encode(obj[k], {
      section: section,
      whitespace: options.whitespace
    })
    if (out.length && child.length) {
      out += EOL
    }
    out += child
  })

  return out
}

function dotSplit (str: string) {
  return str.replace(/\1/g, '\u0002LITERAL\\1LITERAL\u0002')
    .replace(/\\\./g, '\u0001')
    .split(/\./).map(function (part) {
      return part.replace(/\1/g, '\\.')
      .replace(/\2LITERAL\\1LITERAL\2/g, '\u0001')
    })
}

/**
 * Decode the given ini-style formatted document into a nested object.
 * @param str ini-style document
 */
export function decode (str: string) {
  const out: any = {}
  let p = out
  //          section     |key      = value
  const re = /^\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i
  const lines = str.split(/[\r\n]+/g)

  lines.forEach(function (line, _, __) {
    if (!line || line.match(/^\s*[;#]/)) return
    const match = line.match(re)
    if (!match) return
    if (match[1] !== undefined) {
      let section = unsafe(match[1])
      p = out[section] = out[section] || {}
      return
    }
    let key = unsafe(match[2])
    let value: boolean | number | string = match[3] ? unsafe(match[4]) : true
    switch (value) {
      case 'true':
      case 'false':
      case 'null': value = JSON.parse(value)
    }
    const valueAsFloat = parseFloat(`${value}`)
    if (!Number.isNaN(valueAsFloat)) {
      value = valueAsFloat
    }

    // Convert keys with '[]' suffix to an array
    if (key.length > 2 && key.slice(-2) === '[]') {
      key = key.substring(0, key.length - 2)
      if (!p[key]) {
        p[key] = []
      } else if (!Array.isArray(p[key])) {
        p[key] = [p[key]]
      }
    }

    // safeguard against resetting a previously defined
    // array by accidentally forgetting the brackets
    if (Array.isArray(p[key])) {
      p[key].push(value)
    } else {
      p[key] = value
    }
  })

  // {a:{y:1},"a.b":{x:2}} --> {a:{y:1,b:{x:2}}}
  // use a filter to return the keys that have to be deleted.
  Object.keys(out).filter(function (k, _, __) {
    if (!out[k] ||
      typeof out[k] !== 'object' ||
      Array.isArray(out[k])) {
      return false
    }
    // see if the parent section is also an object.
    // if so, add it to that, and mark this one for deletion
    const parts = dotSplit(k)
    let parentSection = out
    const lastPart = parts.pop() ?? ''
    const nl = lastPart.replace(/\\\./g, '.')
    parts.forEach(function (part, _, __) {
      if (!parentSection[part] || typeof parentSection[part] !== 'object') parentSection[part] = {}
      parentSection = parentSection[part]
    })
    if (parentSection === out && nl === lastPart) {
      return false
    }
    parentSection[nl] = out[k]
    return true
  }).forEach(function (del, _, __) {
    delete out[del]
  })

  return out
}

function isQuoted (val: string) {
  return (val.charAt(0) === '"' && val.slice(-1) === '"') ||
    (val.charAt(0) === "'" && val.slice(-1) === "'")
}

/**
 * Escapes the string `val` such that it is safe to be used as a key or
 * value in an ini-file. Basically escapes quotes. For example:
 * 
 * ```javascript
 * ini.safe('"unsafe string"')
 * ```
 * 
 * would result in
 * 
 * ```javascript
 * "\"unsafe string\""
 * ```
 * @param val String to escape
 */
export function safe (val: string | any) {
  return (typeof val !== 'string' ||
    val.match(/[=\r\n]/) ||
    val.match(/^\[/) ||
    (val.length > 1 && isQuoted(val)) ||
    val !== val.trim())
      ? JSON.stringify(val)
      : val.replace(/;/g, '\\;').replace(/#/g, '\\#')
}

/**
 * Unescapes the given string value.
 * @param val String to unescape
 */
export function unsafe (val = '') {
  val = val.trim()
  if (isQuoted(val)) {
    // remove the single quotes before calling JSON.parse
    if (val.charAt(0) === "'") {
      val = val.substr(1, val.length - 2)
    }
    try { val = JSON.parse(val) } catch (_) {}
  } else {
    // walk the val to find the first unescaped ; character
    let esc = false
    let unesc = ''
    for (let i = 0, l = val.length; i < l; i++) {
      const c = val.charAt(i)
      if (esc) {
        if ('\\;#'.indexOf(c) !== -1) {
          unesc += c
        } else {
          unesc += '\\' + c
        }
        esc = false
      } else if (';#'.indexOf(c) !== -1) {
        break
      } else if (c === '\\') {
        esc = true
      } else {
        unesc += c
      }
    }
    if (esc) {
      unesc += '\\'
    }
    return unesc.trim()
  }
  return val
}
