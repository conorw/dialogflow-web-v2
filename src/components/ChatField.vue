<template>
  <div class="chat-field">
    <div class="chat-field-container">
      <!-- Here are the suggestions -->
      <transition name="chat-field-suggestions-animation">
        <div v-if="query.length == 0" class="chat-field-suggestions">
          <slot />
        </div>
      </transition>
      <VEmojiPicker
        v-show="showDialog"
        label-search="Search"
        lang="pt-BR"
        @select="onSelectEmoji"
      />
      <div class="chat-field-flexible">
        <!-- Text input -->
        <!-- <transition name="bounce"> -->
        <textarea
          :key="submissionText"
          ref="inputField"
          v-model="query"
          class="chat-field-input"
          type="text"
          autofocus
          :placeholder="
            (translations[lang()] && translations[lang()].inputTitle) ||
              translations[config.fallback_lang].inputTitle
          "
          :aria-label="
            (translations[lang()] && translations[lang()].inputTitle) ||
              translations[config.fallback_lang].inputTitle
          "
          @keydown="inputHandler"
          @focus="
            microphone = false
            should_listen = false
            $emit('typing')
          "
        />
        <!-- </transition> -->

        <!-- Send message button (arrow button) -->
        <!-- <transition name="chat-field-button-animation" mode="out-in"> -->
        <button
          v-if="(!microphone && query.length > 0) || !microphone_supported"
          key="send"
          class="chat-field-action"
          :title="
            (translations[lang()] && translations[lang()].sendTitle) ||
              translations[config.fallback_lang].sendTitle
          "
          :aria-label="
            (translations[lang()] && translations[lang()].sendTitle) ||
              translations[config.fallback_lang].sendTitle
          "
          @click="submit({ text: query })"
        >
          <i class="material-icons" aria-hidden="true">arrow_upward</i>
        </button>

        <!-- Microphone Button -->
        <button
          v-else
          key="microphone"
          class="chat-field-action"
          :aria-label="
            (translations[lang()] && translations[lang()].microphoneTitle) ||
              translations[config.fallback_lang].microphoneTitle
          "
          :title="
            (translations[lang()] && translations[lang()].microphoneTitle) ||
              translations[config.fallback_lang].microphoneTitle
          "
          :class="{ mic_active: microphone }"
          @click="microphone = !microphone"
        >
          <i class="material-icons" aria-hidden="true">mic</i>
        </button>
        <!-- </transition> -->
      </div>
      <div class="training-options">
        <button
          aria-label="Emoji"
          class="top-head-button emoji"
          @click="toogleDialogEmoji"
        >
          <i class="material-icons" aria-hidden="true">emoji_emotions</i>
        </button>
        <button
          class="top-head-button gif"
          aria-label="GIF"
          title="GIF"
          @click="openGiphy"
        >
          <i class="material-icons" aria-hidden="true">gif</i>
        </button>
        <button
          class="top-head-button stickers"
          aria-label="stickers"
          title="stickers"
          @click="openStickers"
        >
          <img src="/img/stickers.png" />
        </button>
        <span class="training-icons">
          <button
            aria-label="Cancel Conversation"
            title="Cancel Conversation"
            class="top-head-button stop"
            @click="submit({ text: 'cancel' })"
          >
            <i class="material-icons" aria-hidden="true">cancel</i>
          </button>
        </span>
        <span v-if="training == true" class="training-icons">
          <button
            class="top-head-button start"
            title="Start training"
            aria-label="Start training"
            @click="submit({ text: 'training' })"
          >
            <i class="material-icons" aria-hidden="true">model_training</i>
          </button>
          <button
            aria-label="Cancel"
            title="Cancel"
            class="top-head-button stop"
            @click="submit({ text: 'cancel' })"
          >
            <i class="material-icons" aria-hidden="true">cancel</i>
          </button>
          <a href="/api/intents" target="_blank">
            <button
              class="top-head-button traininglist"
              title="View Training List"
              aria-label="View Training List"
            >
              <i class="material-icons" aria-hidden="true">view_list</i>
            </button>
          </a>
          <button
            class="top-head-button feedback"
            aria-label="Feedback"
            title="Feedback"
            @click="submit({ text: 'feedback' })"
          >
            <i class="material-icons" aria-hidden="true">feedback</i>
          </button>
          <button
            class="top-head-button topics"
            aria-label="Troubling Topics"
            title="Troubling Topics"
            @click="submit({ text: 'Add Troubling Topics' })"
          >
            <i class="material-icons" aria-hidden="true">report</i>
          </button>
        </span>
      </div>
    </div>
    <modal name="example" height="auto" width="80%">
      <giphy-search :api="getApi" @select="select" />
    </modal>
  </div>
</template>

<script>
import { VEmojiPicker } from 'v-emoji-picker'
import GiphySearch from '@/components/GiphySearch'
import AudioRecorder from 'audio-recorder-polyfill'
import * as hark from 'hark'

window.MediaRecorder = AudioRecorder

export default {
  name: 'ChatField',
  components: {
    VEmojiPicker,
    GiphySearch
  },
  props: {
    training: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  data() {
    return {
      query: '',
      submissionText: '',
      showDialog: false,
      microphone: false,
      recognition: null,
      recorder: null,
      should_listen: false,
      api: ''
    }
  },
  computed: {
    getApi() {
      return this.api
    },
    microphone_supported() {
      return (
        window.webkitSpeechRecognition ||
        window.SpeechRecognition ||
        !window.MediaRecorder.notSupported
      )
    }
  },
  watch: {
    /* Toggle microphone */
    microphone(activate) {
      if (activate) {
        this.should_listen = true
        this.$emit('listening')

        if (window.webkitSpeechRecognition || window.SpeechRecognition) {
          this.recognition =
            new window.webkitSpeechRecognition() ||
            new window.SpeechRecognition()
          this.recognition.interimResults = true
          this.recognition.lang = this.lang()
          this.recognition.onresult = event => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              this.query = event.results[i][0].transcript // <- push results to the Text input
            }
          }

          this.recognition.onend = () => {
            this.recognition.stop()
            this.microphone = false
            this.submit({ text: this.query }) // <- submit the result
          }

          this.recognition.onerror = () => this.microphone = false
          this.recognition.start()
        } else if (window.MediaRecorder) {
          navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then(stream => {
              this.recorder = new window.MediaRecorder(stream)
              this.recorder.addEventListener('dataavailable', recording => {
                const reader = new FileReader()
                reader.readAsDataURL(recording.data)
                reader.onloadend = () => {
                  this.submit({
                    audio: reader.result.replace(/^data:.+;base64,/, '')
                  })
                }
              })

              hark(this.recorder.stream).on('stopped_speaking',
                () => this.microphone = false) // <- Speech end detection
              this.recorder.start()
            })
            .catch(() => this.microphone = false)
        }
      } else if (this.recognition) this.recognition.abort()
      else if (this.recorder) this.recorder.stop()
    }
  },
  mounted() {
    const vueRef = this
    this.$nextTick(() => {
      vueRef.$refs.inputField.focus()
    })
  },
  methods: {
    openGiphy() {
      this.api = 'gifs'
      this.$modal.show('example')
    },
    openStickers() {
      this.api = 'stickers'
      this.$modal.show('example')
    },
    select(gif) {
      this.$modal.hide('example')
      this.submit({ text: gif })
    },
    inputHandler(e) {
      if (e.keyCode === 13 && !e.shiftKey) {
        e.preventDefault()
        this.submit({ text: this.query })
      }
    },
    toogleDialogEmoji() {
      this.showDialog = !this.showDialog
    },
    onSelectEmoji(emoji) {
      this.query += emoji.data
      // Optional
      this.toogleDialogEmoji()
    },
    listen() {
      if (this.should_listen) this.microphone = true
    },
    submit(submission) {
      const vueRef = this
      if (submission.text && submission.text.length > 0) {
        this.submissionText = submission.text
        vueRef.$emit('submit', submission)
        vueRef.query = ''
        vueRef.showDialog = false
      } else if (submission.audio) vueRef.$emit('submit', submission)
      this.$nextTick(() => {
        vueRef.$refs.inputField.focus()
      })
    }
  }
}
</script>
<style lang="sass" scoped>
@import '@/style/mixins'


.bounce-enter-active
  animation: bounce-in .2s

.bounce-leave-active
  animation: bounce-in .2s reverse

@keyframes bounce-in
  0%
    transform: scale(0)
  50%
    transform: scale(1.2)
  100%
    transform: scale(1)


.chat-field
    position: fixed
    bottom: 0
    left: 0
    width: 100%
    background-color: var(--background)
    z-index: 2

.chat-field-container
    max-width: var(--container-width)
    margin: auto auto
    padding: 12px

.chat-field-flexible
    display: flex
    border-radius: 40px

.chat-field-suggestions
    overflow-x: scroll
    overflow-y: hidden
    white-space: nowrap
    -webkit-overflow-scrolling: touch

    &::-webkit-scrollbar
        display: none

.chat-field-input
    font-size: 16px
    width: 100%
    height: 50px
    box-sizing: border-box
    border: none
    padding: 10px 0 10px 12px
    border-radius: 5px 0 0 5px


.chat-field-action
    @include reset
    padding: 10px 12px
    cursor: pointer
    color: var(--accent)
    background-color: whitesmoke
    font-size: 24px
    display: flex

    &.mic_active
        color: #F44336

.chat-field-suggestions-animation-enter-active, .chat-field-suggestions-animation-leave-active
    transition: all .15s var(--animation-timing)

.chat-field-suggestions-animation-enter, .chat-field-suggestions-animation-leave-to
    transform: translateY(10px)
    opacity: 0

.chat-field-button-animation-enter-active, .chat-field-button-animation-leave-active
    transition: all .15s var(--animation-timing)

.chat-field-button-animation-enter, .chat-field-button-animation-leave-to
    transform: scale(0)
    opacity: 0

.top-head-button
  background-color: transparent
  border: 0
  color: black
  width: 30px
  margin: 2px 2px
  padding: 1px 2px
  font-size: small
  cursor: pointer

.top-head-button.start
  color: green

.top-head-button.stop
  color: red

.top-head-button.topics
  color: orange

.top-head-button.feedback
  color: blue

.top-head-button.stickers img
  width: 100%

.top-head-button.emoji
  color: darkgrey

.top-head-button:hover
  background: #2196F3
  color: white

.training-icons
    float: right
</style>
