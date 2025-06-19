export const criticalNavCSS = `
:root {
  --primary-color: #3b82f6;
  --primary-light: #93c5fd;
  --primary-dark: #1e40af;
  --header-bg: #ffffff;
  --header-text: #1f2937;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Site-wide colors */
  --body-bg: #f9fafb;
  --body-text: #111827;
  --card-bg: #ffffff;
  --card-border: #e5e7eb;
  --card-text: #374151;
  --muted-text: #6b7280;
  --success-color: #10b981;
  --success-light: #d1fae5;
  --warning-color: #f59e0b;
  --warning-light: #fef3c7;
  --danger-color: #ef4444;
  --danger-light: #fee2e2;
  --secondary-color: #6b7280;
  --secondary-light: #e5e7eb;
  --controls-bg: #f3f4f6;
  --controls-text: #111827;
  --switch-active: #3b82f6;
  --switch-inactive: #6b7280;
  --search-icon: #6b7280;
  --search-text: #111827;
  --search-placeholder: #6b7280;
  --search-bg: #f3f4f6;
  --focus-ring: rgba(59,130,246,0.5);
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
}

/* Force light mode - Override any dark mode attempts */
html,
html.dark-mode,
html.dark,
html.dark-theme,
.dark-mode {
  --header-bg: #ffffff !important;
  --header-text: #1f2937 !important;
  --primary-color: #3b82f6 !important;
  --primary-light: #93c5fd !important;
  --primary-dark: #1e40af !important;
  --body-bg: #f9fafb !important;
  --body-text: #111827 !important;
  --card-bg: #ffffff !important;
  --card-border: #e5e7eb !important;
  --card-text: #374151 !important;
  --muted-text: #6b7280 !important;
  --success-color: #10b981 !important;
  --success-light: #d1fae5 !important;
  --warning-color: #f59e0b !important;
  --warning-light: #fef3c7 !important;
  --danger-color: #ef4444 !important;
  --danger-light: #fee2e2 !important;
  --secondary-color: #6b7280 !important;
  --secondary-light: #e5e7eb !important;
  --controls-bg: #f3f4f6 !important;
  --controls-text: #111827 !important;
  --switch-active: #3b82f6 !important;
  --switch-inactive: #6b7280 !important;
  --search-icon: #6b7280 !important;
  --search-text: #111827 !important;
  --search-placeholder: #6b7280 !important;
  --search-bg: #f3f4f6 !important;
  background-color: #f9fafb !important;
  color: #111827 !important;
}

/* Base styles with transitions */
body{background-color:var(--body-bg);color:var(--body-text);transition:background-color .3s,color .3s}
header{background-color:var(--header-bg)!important;color:var(--header-text)!important;transition:background-color .3s,color .3s,border-color .3s}
.bg-white.z-30,header.z-30,header.sticky{background-color:var(--header-bg)!important}
.dark-mode .bg-white.z-30,.dark-mode header.z-30,.dark-mode header.sticky{background-color:var(--header-bg)!important}

/* Controls and cards */
.bg-gray-100,.bg-controls-bg{background-color:var(--controls-bg)!important;color:var(--controls-text)!important;transition:background-color .3s,color .3s}
.bg-white{background-color:var(--card-bg)!important;transition:background-color .3s,border-color .3s}
.dark-mode .bg-white{background-color:var(--card-bg)!important}
.dark-mode .border-gray-100,.dark-mode .border-gray-200{border-color:var(--card-border)}
.dark-mode .text-gray-500,.dark-mode .text-gray-600{color:var(--muted-text)}
.dark-mode .text-gray-700,.dark-mode .text-gray-800,.dark-mode .text-gray-900{color:var(--body-text)}
.dark-mode .bg-gray-50,.dark-mode .bg-gray-100{background-color:var(--secondary-light)}

/* Form elements */
input[type="text"],input[type="search"]{background-color:var(--search-bg);color:var(--search-text);transition:background-color .3s,color .3s,border-color .3s}
input[type="text"]::placeholder,input[type="search"]::placeholder{color:var(--search-placeholder)}
button svg[stroke],.search-icon{color:var(--search-icon)}

/* Custom controls */
.vendor-controls .label,.testing-controls .label{color:var(--controls-text)!important;font-weight:500}
.switch-button{background-color:var(--switch-inactive);transition:background-color .3s}
.switch-button.active{background-color:var(--switch-active)}

/* Accessibility - Skip links and focus */
.skip-link{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}
.skip-link.focus:not-sr-only{position:absolute;width:auto;height:auto;padding:var(--spacing-md);margin:0;overflow:visible;clip:auto;white-space:normal;background-color:var(--primary-color);color:white;border-radius:0.25rem;z-index:100}
a:focus,button:focus{outline:var(--focus-ring-width) solid var(--focus-ring);outline-offset:var(--focus-ring-offset)}

/* Core navigation styles */
header{position:sticky;top:0;z-index:30;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
[dir="rtl"] .header-logo{margin-right:0;margin-left:var(--spacing-sm)}

/* Responsive behavior */
@media (max-width:768px){.desktop-nav{display:none}}
.nav-transition{transition:transform .3s,opacity .3s;will-change:transform,opacity}
main{margin-top:0}

/* Color overrides */
.text-gray-800,.text-gray-900{color:var(--body-text)!important}
.text-gray-600,.text-gray-700{color:var(--card-text)!important}
.text-gray-500{color:var(--muted-text)!important}
`;

export const injectCriticalCSS = () => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = criticalNavCSS;
    document.head.appendChild(style);
    
    // Add class to html element to help style overrides take effect immediately
    document.documentElement.classList.add('theme-enabled');
    
    // Always force light mode - ignore any saved theme preferences
    document.documentElement.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
  }
}; 
