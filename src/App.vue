<template>
  <div id="app">
    <RouterView v-slot="{ Component, route }">
      <AnimatePresence mode="wait">
        <motion.div
          :key="route.name?.toString()"
          :initial="prefersReducedMotion ? false : { opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: prefersReducedMotion ? 0 : 0.15 }"
        >
          <component :is="Component" />
        </motion.div>
      </AnimatePresence>
    </RouterView>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { motion, AnimatePresence } from 'motion-v'
import { useMotionPresets } from '@/composables/useMotionPresets'
import { useTheme } from '@/composables/useTheme'

const { prefersReducedMotion } = useMotionPresets()
useTheme()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
  background: var(--color-background);
  transition: background-color 0.2s ease;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color-foreground);
  min-height: 100vh;
  width: 100%;
}

p {
  margin-bottom: 0;
}
</style>
