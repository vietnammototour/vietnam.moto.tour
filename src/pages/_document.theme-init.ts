// Synchronous theme bootstrap injected into <body> before paint.
// Kept as a plain string so the script tag can render it without
// raw-HTML injection. Must contain no `<` or `>` characters — React
// escapes those even inside <script> children.
export const themeInitScript = `(function(){try{var m=document.cookie.match(/(?:^|; )NEXT_THEME=(\\w+)/);var t=m&&m[1]==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;
