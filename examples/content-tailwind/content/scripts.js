import {getContentHtml} from './content'

let unmount

if (import.meta.webpackHot) {
  import.meta.webpackHot?.accept()
  import.meta.webpackHot?.dispose(() => unmount?.())
}

console.log('hello from content_scripts')

if (document.readyState === 'complete') {
  unmount = initial() || (() => {})
} else {
  document.addEventListener('readystatechange', () => {
    if (document.readyState === 'complete') unmount = initial() || (() => {})
  })
}

function initial() {
  const rootDiv = document.createElement('div')
  rootDiv.id = 'extension-root'
  document.body.appendChild(rootDiv)

  // Injecting content_scripts inside a shadow dom
  // prevents conflicts with the host page's styles.
  // This way, styles from the extension won't leak into the host page.
  const shadowRoot = rootDiv.attachShadow({mode: 'open'})
  const style = new CSSStyleSheet()
  shadowRoot.adoptedStyleSheets = [style]
  fetchCSS().then((response) => style.replace(response))

  if (import.meta.webpackHot) {
    import.meta.webpackHot?.accept('./styles.css', () => {
      fetchCSS().then((response) => style.replace(response))
    })
  }

  // Create container div and inject content
  const contentDiv = document.createElement('div')
  contentDiv.className = 'content_script'
  contentDiv.innerHTML = getContentHtml()

  // Append the content div to shadow root
  shadowRoot.appendChild(contentDiv)

  return () => {
    rootDiv.remove()
  }
}

async function fetchCSS() {
  const cssUrl = new URL('./styles.css', import.meta.url)
  const response = await fetch(cssUrl)
  const text = await response.text()
  return response.ok ? text : Promise.reject(text)
}
