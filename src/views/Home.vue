<template>
  <main
    id="main"
    :style="{ backgroundImage: `url('${image}')` }"
  >
    <TopHead
      v-if="agent"
      :agent="agent"
      :voices="voices"
      :selectedvoice.sync="config.voice"
      @submit="send"
      @background="background"
    >
      <TopHeadAction
        :title="
          muted
            ? (translations[lang()] && translations[lang()].unMuteTitle) ||
              translations[config.fallback_lang].unMuteTitle
            : (translations[lang()] && translations[lang()].muteTitle) ||
              translations[config.fallback_lang].muteTitle
        "
        :icon="muted ? 'volume_off' : 'volume_up'"
        @click.native="muted = !muted"
      />
    </TopHead>
    <transition
      name="shake"
      mode="out-in"
    >
      <section
        :key="botText"
        class="bot-profile"
        aria-live="polite"
      >
        <img
          v-if="botImage"
          class="top-head-icon"
          :alt="botName"
          :src="botImage"
        >
        <img
          v-else
          class="top-head-icon"
          src="/img/icon.png"
          :alt="botName"
        >
        <div class="bot-title">
          <span>{{ botName }}</span>
        </div>
      </section>
    </transition>
    <!-- TopHead is the header with the information about the app -->
    <!-- <TopHead
            v-if="agent"
            :agent="agent"
            :voices="voices"
            :selectedvoice.sync="config.voice"
            @submit="send"
        >
            <TopHeadAction
                :title="
                    muted
                        ? (translations[lang()] && translations[lang()].unMuteTitle) ||
                            translations[config.fallback_lang].unMuteTitle
                        : (translations[lang()] && translations[lang()].muteTitle) ||
                            translations[config.fallback_lang].muteTitle
                "
                :icon="muted ? 'volume_off' : 'volume_up'"
                @click.native="muted = !muted"
            />
        </TopHead> -->
    <!-- <section class="bot-profile" aria-live="polite">
            <img
                v-if="agent.avatarUri"
                class="top-head-icon"
                :alt="agent.displayName"
                :src="agent.avatarUri"
            >
            <img
                v-else
                class="top-head-icon"
                src="/img/icon.png"
                :alt="agent.displayName"
            >
            <div class="bot-title">{{agent.displayName}}</div>
        </section> -->
    <BotMessage
      v-if="lastMessage"
      class="bot-chat"
      :loading="loading"
      :training="training"
      :message="lastMessage"
    />

    <MyMessage
      v-if="lastMessage"
      class="me-chat"
      :message="lastMessage"
    />
    <transition
      name="shake"
      mode="out-in"
    >
      <section
        :key="meText"
        class="my-profile"
        aria-live="polite"
      >
        <img
          class="top-head-icon"
          :src="myAvatar"
          alt="My-Avatar"
        >
        <div class="bot-title">
          <span><button
            class="top-head-button"
            aria-label="Change Avatar"
            title="Change Avatar"
            @click="openAvatar"
          >
            <i
              class="material-icons"
              aria-hidden="true"
            >face</i>
          </button>Me</span>
        </div>
      </section>
    </transition>
    <modal
      name="avatar"
      height="90%"
      width="80%"
    >
      <ChooseAvatar @avatar="avatar" />
    </modal>
    <!-- ChatField is made for submitting queries and displaying suggestions -->
    <ChatField
      ref="input"
      :training="false"
      @submit="send"
      @listening="stop_feedback"
      @typing="stop_feedback"
    >
      <!-- RichSuggesion chips
                https://developers.google.com/actions/assistant/responses#suggestion_chips
                https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#QuickReplies
                https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#Suggestions
            -->
      <RichSuggesion
        v-for="(suggestion, suggestion_id) in suggestions.text_suggestions"
        :key="'text-' + suggestion_id"
        :title="suggestion"
        @click.native="send({ text: suggestion })"
      />

      <!-- Link suggestion chips
                https://developers.google.com/actions/assistant/responses#suggestion_chips
                https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#LinkOutSuggestion
                https://cloud.google.com/dialogflow/docs/integrations/dialogflow-messenger#suggestion_chip_response_type
            -->
      <RichSuggesion
        v-for="(suggestion, suggestion_id) in suggestions.link_suggestions"
        :key="'link-' + suggestion_id"
        :title="suggestion.destinationName || suggestion.text"
        :uri="suggestion.uri || suggestion.url || suggestion.link"
      />
    </ChatField>
  </main>
</template>

<script>
// import WelcomeView from '@/views/WelcomeView.vue'
// import TopHead from '@/components/TopHead.vue'
// import TopHeadAction from '@/components/TopHeadAction.vue'
import ChatField from '@/components/ChatField.vue'
import ChooseAvatar from '@/components/ChooseAvatar.vue'
import RichSuggesion from '@/components/RichSuggestion.vue'
import TopHead from '@/components/TopHead.vue'
import TopHeadAction from '@/components/TopHeadAction.vue'
import BotMessage from '@/components/BotMessage'
import MyMessage from '@/components/MyMessage'

import * as uuidv1 from 'uuid/v1'

import { Client } from 'dialogflow-gateway'
import Axios from 'axios'

export default {
    name: 'Home',
    components: {
        ChooseAvatar,
        TopHead,
        TopHeadAction,
        ChatField,
        MyMessage,
        BotMessage,
        RichSuggesion
    },
    data(){
        return {
            agent: null,
            messages: [],
            training: true,
            image: '',
            myAvatar: '',
            botImage: '',
            botName: '',
            lastMessage: null,
            botDetails: {},
            language: '',
            meText: '',
            botText: '',
            session: '',
            muted: true,
            loading: false,
            error: null,
            voices: [],
            client: new Client(this.config.endpoint),
            audio: new Audio()
        }
    },
    computed: {
        suggestions(){
            if (this.messages.length > 0){
                const last_message = this.messages[this.messages.length - 1]
                const text_suggestions = []
                const link_suggestions = []

                /* Dialogflow Suggestions */
                for (const component in last_message.queryResult.fulfillmentMessages){
                    if (
                        last_message.queryResult.fulfillmentMessages[component].suggestions
                    ){ text_suggestions.push(...last_message.queryResult.fulfillmentMessages[
                    component
                    ].suggestions.suggestions.map(suggestion => suggestion.title)) }
                    if (
                        last_message.queryResult.fulfillmentMessages[component]
                        .linkOutSuggestion
                    ){ link_suggestions.push(last_message.queryResult.fulfillmentMessages[component]
                    .linkOutSuggestion) }
                    if (
                        last_message.queryResult.fulfillmentMessages[component].quickReplies
                    ){ text_suggestions.push(...last_message.queryResult.fulfillmentMessages[component]
                    .quickReplies.quickReplies) }
                    if (
                        last_message.queryResult.fulfillmentMessages[component].payload &&
            last_message.queryResult.fulfillmentMessages[component].payload
            .richContent
                    ){
                        last_message.queryResult.fulfillmentMessages[
                        component
                        ].payload.richContent.forEach(stack => {
                            const chips = stack.find(item => item.type == 'chips')
                            if (chips) link_suggestions.push(...chips.options)
                        })
                    }
                }

                /* Google Suggestions */
                if (
                    last_message.queryResult.webhookPayload &&
          last_message.queryResult.webhookPayload.google
                ){
                    for (const component in last_message.queryResult.webhookPayload
                    .google){
                        if (
                            last_message.queryResult.webhookPayload.google[component]
                            .suggestions
                        ){ text_suggestions.push(...last_message.queryResult.webhookPayload.google[
                        component
                        ].suggestions.map(suggestion => suggestion.title)) }
                        if (
                            last_message.queryResult.webhookPayload.google[component]
                            .linkOutSuggestion
                        ){ link_suggestions.push(last_message.queryResult.webhookPayload.google[component]
                        .linkOutSuggestion) }
                    }
                }

                return { text_suggestions, link_suggestions }
            }

            return {
                text_suggestions: this.config.start_suggestions // <- if no messages are present, return start_suggestions, from config.js to help user figure out what he can do with your application
            }
        }
    },
    watch: {
    /* This function is triggered, when new messages arrive */
        messages(messages){
            this.lastMessage = messages.length ? messages[messages.length - 1] : null
            if (this.history()) sessionStorage.setItem('message_history', JSON.stringify(messages)) // <- Save history if the feature is enabled
        },
        /* If muted, stop playing feedback */
        muted(muted){
            this.audio.muted = muted
            if (muted) this.stop_feedback()
        }
    },
    beforeMount(){
        if (sessionStorage.getItem('bot') !== null){
            this.botDetails = JSON.parse(sessionStorage.getItem('bot'))
            this.botImage = this.botDetails.avatar
            this.botName = this.botDetails.name
        }
        this.image = localStorage.getItem('background') || '/img/backgrounds/Wintery-Sunburst.svg'
        this.myAvatar = localStorage.getItem('avatar') || '/img/avatars/SVG/flat/27-ninja.svg'
        this.training = !!this.$route.query.training || true
    },
    created(){
    /* Mute audio to comply with auto-play policies */
        this.audio.muted = true
        this.voices = speechSynthesis.getVoices()
        this.config.voice = this.voices.length
            ? this.voices[0].voiceURI
            : this.config.voice
        speechSynthesis.onvoiceschanged = () => {
            this.voices = speechSynthesis.getVoices()
            this.config.voice = this.voices.length
                ? this.voices[0].voiceURI
                : this.config.voice
        }
        /* If history is enabled, the messages are retrieved from sessionStorage */
        if (this.history() && sessionStorage.getItem('message_history') !== null){
            this.messages = JSON.parse(sessionStorage.getItem('message_history'))
        }

        /* Session should be persistent (in case of page reload, the context should stay) */
        if (this.history() && sessionStorage.getItem('session') !== null){
            this.session = sessionStorage.getItem('session')
        } else {
            this.session = uuidv1()
            if (this.history()) sessionStorage.setItem('session', this.session)
        }
        /* Cache Agent (this will save bandwith) */
        if (this.history() && sessionStorage.getItem('agent') !== null){
            this.agent = JSON.parse(sessionStorage.getItem('agent'))
        } else {
            this.client
            .get()
            .then(agent => {
                this.agent = agent
                if (this.history()) sessionStorage.setItem('agent', JSON.stringify(agent))
            })
            .catch(error => {
                this.error = error.message
            })
        }
        // get the bot details
        Axios.get('/api/bot').then(t => {
            if (t.data){
                this.botDetails = t.data
                this.botImage = this.botDetails.avatar
                this.botName = this.botDetails.name
                if (this.history()) sessionStorage.setItem('bot', JSON.stringify(this.botDetails))
            }
        })
    },
    methods: {
        openAvatar(){
            this.$modal.show('avatar')
        },
        avatar(avatar){
            console.log(avatar)
            this.$modal.hide('avatar')
            this.myAvatar = avatar
        },
        background(bck){
            this.image = bck
        },
        voiceChanged(data){
            this.config.voice = data
        },
        send(submission){
            let request
            /* Text request */
            if (submission.text){
                request = {
                    session: this.session,
                    queryInput: {
                        text: {
                            text: submission.text,
                            languageCode: this.lang()
                        }
                    }
                }
            } else if (submission.audio){
                /* Audio request */
                request = {
                    session: this.session,
                    queryInput: {
                        audioConfig: {
                            audioEncoding: 'AUDIO_ENCODING_UNSPECIFIED',
                            languageCode: this.lang()
                        }
                    },
                    inputAudio: submission.audio
                }
            }

            this.stop_feedback()
            this.loading = true
            this.error = null
            if (submission.text){
                this.meText = submission.text
                this.lastMessage = {queryResult: {queryText: submission.text}}
            }
            /* Send the request to endpoint */
            this.client
            .send(request)
            .then(response => {
                this.messages.push(response)
                this.handle(response) // <- trigger the handle function (explanation below)
                if (this.debug()) console.log(response) // <- log responses in development mode
            })
            .catch(error => {
                this.error = error.message
            })
            .then(() => this.loading = false)
        },
        handle(response){
            /* Speech output */
            if (response.outputAudio.data.length){
                /* Detect MIME type (or fallback to default) */
                const mime =
          this.config.codecs[response.outputAudioConfig.audioEncoding] ||
          this.config.codecs.OUTPUT_AUDIO_ENCODING_UNSPECIFIED
                this.audio.src = `data:${mime};base64,${response.outputAudio}`
                this.audio.onended = () => this.$refs.input.listen()

                if (!this.muted) this.audio.play()
            } else {
                let text = '' // <- init a text variable

                /* Dialogflow Text/SimpleResponses */
                for (const component in response.queryResult.fulfillmentMessages){
                    if (response.queryResult.fulfillmentMessages[component].text) text += `${response.queryResult.fulfillmentMessages[component].text.text[0]}. `
                    if (
                        response.queryResult.fulfillmentMessages[component]
                        .simpleResponses &&
            response.queryResult.fulfillmentMessages[component].simpleResponses
            .simpleResponses[0].textToSpeech
                    ) text += `${response.queryResult.fulfillmentMessages[component].simpleResponses.simpleResponses[0].textToSpeech}. `
                    if (response.queryResult.fulfillmentMessages[component].rbmText) text += `${response.queryResult.fulfillmentMessages[component].rbmText.text}. `
                }

                /* Actions on Google Simple response */
                if (
                    response.queryResult.webhookPayload &&
          response.queryResult.webhookPayload.google
                ){
                    for (const component in response.queryResult.webhookPayload.google
                    .richResponse.items){
                        if (
                            response.queryResult.webhookPayload.google.richResponse.items[
                            component
                            ].simpleResponse &&
              response.queryResult.webhookPayload.google.richResponse.items[
              component
              ].simpleResponse.textToSpeech
                        ) text += `${response.queryResult.webhookPayload.google.richResponse.items[component].simpleResponse.textToSpeech}. `
                    }
                }

                const speech = new SpeechSynthesisUtterance(text)
                speech.voiceURI = this.config.voice
                console.log(speech.voiceURI)
                speech.lang = this.lang()
                speech.onend = () => this.$refs.input.listen()

                if (!this.muted) window.speechSynthesis.speak(speech) // <- if app is not muted, speak out the speech

                this.botText = text
            }
            console.log('Result', {resp: response.queryResult})
            if (response.queryResult.sentimentAnalysisResult){
                console.log(response.queryResult.sentimentAnalysisResult)
                console.log(this.botDetails)
                if (this.botDetails){
                    const score = parseFloat(response.queryResult.sentimentAnalysisResult.queryTextSentiment.score * response.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude).toFixed(2)
                    console.log(score)
                    // 0.6-1 = v positive
                    if (score >= .6){
                        console.log(this.botDetails.sentiment_v_positive)
                        this.botImage = this.botDetails.sentiment_v_positive || this.botImage
                        return
                    }
                    // 0.1-0.6 = positive
                    if (score > 0.2){
                        console.log(this.botDetails.sentiment_positive)
                        this.botImage = this.botDetails.sentiment_positive || this.botImage
                        return
                    }
                    // -0.2-0.2 = neutral
                    if (score >= -0.2){
                        console.log(this.botDetails.sentiment_neutral)
                        this.botImage = this.botDetails.sentiment_neutral || this.botImage
                        return
                    }
                    // -0.6-0.2 = negative
                    if (score >= -0.6){
                        console.log(this.botDetails.sentiment_negative)
                        this.botImage = this.botDetails.sentiment_negative || this.botImage
                        return
                    }
                    // -1 = v. negative
                    console.log(this.botDetails.sentiment_v_negative)
                    this.botImage = this.botDetails.sentiment_v_negative || this.botImage
                }
            }
        },
        /* Stop audio speech/playback */
        stop_feedback(){
            if (window.speechSynthesis) window.speechSynthesis.cancel()
            if (this.audio && !this.audio.paused) this.audio.pause()
        }
    }
}
</script>

<style lang="sass">
@import '@/style/theme.sass'
body
    margin: 0
    padding: 0
#main
    margin: 0
    padding: 0
    font-family: var(--font)
    font-display: swap
    height: 100vh
    width: 100vw
    background-color: var(--background)
    background-attachment: fixed
    background-size: cover

.top-head-button
    background: transparent
    border: none

.top-head-icon
    object-fit: cover

.shake-enter-active
  animation: shake .3s cubic-bezier(0.31, 0.07, 0.39, 0.97) both
  transform: translate3d(0, 0, 0)
  backface-visibility: hidden
  perspective: 1000px

@keyframes shake
  10%,90%
    transform: translate3d(-1px, 0, 0)
  20%,80%
    transform: translate3d(2px, 0, 0)
  30%,50%,70%
    transform: translate3d(-4px, 0, 0)
  40%,60%
    transform: translate3d(4px, 0, 0)


.chat
    max-width: var(--container-width)
    margin: auto auto
    padding: 70px 12px 112px 12px

.chat-field
    background-color: transparent !important

.rich-card-content
    padding: 6px
.rich-card-title
    font-size: medium !important
    line-height: 1em !important
.rich-card-text
    font-size: small !important
    max-height: 40vh
    overflow: auto

.bot-chat
    width: 50% !important
    height: 25% !important
    top: 15%
    position: absolute
    right: 30px
    z-index: 2
.bot-chat .rich-component
    text-align: center
    height: 100%
    width: 100%

.bot-chat .rich-bubble
    text-align: center
    height: 100% !important


.me-chat
    width: 45% !important
    height: 20% !important
    bottom: 30%
    margin-left: 5%
    position: absolute
.me-chat .rich-bubble
    width: 100%
    text-align: center
    vertical-align: center
    height: 100%

.bot-profile
    position: -webkit-sticky
    position: sticky
    top: 5%
    display: inline
    position: absolute
    width: 50%

.bot-profile img
    width: 100%

.bot-title
    text-align: center
    margin-top: -10px

.bot-title span
    font-size: x-large
    border: aqua
    background: white
    width: min-content
    text-align: center
    border-radius: 10px
    left: auto
    border-width: thick
    border-style: dotted

.rich-bubble.me
    border: 10px solid black !important
    border-top-right-radius: 40px !important
    border-bottom-right-radius: 0 !important

.rich-bubble
    border: 10px solid black !important

.rich-bubble::after
    content: "" !important
.rich-bubble::before
    content: "" !important

.confidence-score
    position: absolute
    font-size: xx-small
    background: red
    color: white
    padding: 5px

.my-profile
    position: -webkit-sticky
    position: sticky
    bottom: 18vh
    display: inline
    position: absolute
    width: 45%
    right: 5%

.my-profile img
    width: 100%

@media screen and (min-width: 720px)
    .bot-profile
        width: 50%
        right: 50%
        max-width: 30vh
    .bot-profile img
        width: 100%
    .bot-chat
        width: 45% !important
    .bot-chat .rich-component
        width: 100%
    .my-profile
        left: 55%
        max-width: 25vh

@media screen and (max-height: 500px)
    .bot-profile
        width: 20vw
        right: 50%
        max-height: 30vh
    .bot-profile img
        width: 100%
    .bot-chat
        width: 45% !important
    .my-profile
        left: 55%
        width: 20vw
        top: 40%
    .me-chat
        bottom: 25%
    .rich-bubble
        max-height: 50%
</style>
