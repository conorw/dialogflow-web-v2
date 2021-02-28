<template>
  <div>
    <div v-for="message in messages" :key="message.responseId">
      <Message :message="message" :loading="loading" :training="training" />
    </div>
  </div>
</template>
<script>
import Message from '@/components/Message'

export default {
  name: 'MessageList',
  components: {
    Message
  },
  props: {
    messages: {
      type: Array,
      required: false,
      default: () => []
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
    },
    training: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  watch: {
    /* This function is triggered, when request is started or finished */
    loading() {
      setTimeout(() => {
        const app = document.querySelector('#app') // <- We need to scroll down #app, to prevent the whole page jumping to bottom, when using in iframe
        if (app.querySelector('#message')) {
          const message =
            app.querySelectorAll('#message')[
              app.querySelectorAll('#message').length - 1
            ].offsetTop - 70
          window.scrollTo({ top: message, behavior: 'smooth' })
        }
      }, 2) // <- wait for render (timeout) and then smoothly scroll #app down to the last message
    }
  }
}
</script>

<style lang="sass">
.chat
    max-width: var(--container-width)
    margin: auto auto
    padding: 70px 12px 112px 12px
</style>
