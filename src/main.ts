import './style.css'
import './assets/design-tokens.css'
import './assets/fonts/fonts.css'
import 'bootstrap/dist/css/bootstrap.min.css'
// admin-ui.css must load after Bootstrap: several admin pages still carry
// legacy Bootstrap classes (btn, btn-primary, form-control, ...) alongside
// the newer admin-* classes, and at equal specificity the later import wins.
// Without this order, Bootstrap's blue/gray defaults silently override the
// admin design system's colors on any element that kept both class sets.
import './assets/admin-ui.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')

