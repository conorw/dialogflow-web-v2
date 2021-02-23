<template>
  <div class="bg-gray-100">
    <div>
      <header
        x-data="{ mobileMenuOpen : false }"
        class="flex flex-row justify-between space-x-4 bg-white py-6 px-6"
      >
        <div class="relative z-30 w-5/6 px-6 py-8 md:py-2 md:w-1/2">
          <h1 class="text-5xl">Bot Personality</h1>
          <h2 class="text-2xl">
            Edit the question and answers for your bot's personality
          </h2>
        </div>
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="inline-block md:hidden w-8 h-8 bg-gray-200 text-gray-600 p-1"
        >
          <svg
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </button>
        <nav
          class="absolute md:relative top-16 left-0 md:top-0 z-20 md:flex flex-col md:flex-row md:space-x-6 font-semibold w-full md:w-auto bg-white shadow-md rounded-lg md:rounded-none md:shadow-none md:bg-transparent p-6 pt-0 md:p-0"
          :class="{ flex: mobileMenuOpen, hidden: !mobileMenuOpen }"
          @click.away="mobileMenuOpen = false"
        >
          <div class="block py-1 text-indigo-600 hover:underline">
            <a href="/">Home</a>
          </div>
          <div
            class="block py-1 text-indigo-600 hover:underline"
            title="View Stats"
            aria-label="View Stats"
          >
            <a href="/api/intents" target="_blank">
              View Bot Stats
            </a>
          </div>
        </nav>
      </header>

      <tabs>
        <tab title="Questions & Responses">
          <div>
            <div class="flex flex-row justify-between space-x-4 ">
              <div
                class="block py-1 text-indigo-600 hover:underline"
                @click="expandCollapseAll()"
              >
                Expand/Collapse All
              </div>
              <div
                class="block py-1 text-indigo-600 hover:underline"
                @click="reload"
              >
                Undo Changes
              </div>
            </div>

            <div>
              <IntentCategory
                v-for="(category, idx) in categories"
                :key="category.name"
                :index="idx"
                :category-obj="category"
                @add-new="addNew"
              />
            </div>
          </div>
        </tab>
        <tab :title="`Urgent Attention (${unknowns.length})`">
          <div>
            <div style="margin: 20px">
              <h2>Questions that your bot has no answer for</h2>
              <h3>Please train your bot to respond to these statements:</h3>
              <div
                class="flex items-center justify-between my-4"
                v-for="unknown in unknowns"
                :key="unknown.id"
              >
                <span class="font-bold flex-1">"{{ unknown.statement }}"</span>
                <button  @click="deleteUnknown(unknown.id)">
                  Mark as trained
                </button>
                <button  @click="addTraining(unknown)">
                  Train Now
                </button>
              </div>
            </div>
          </div>
        </tab>
        <tab :title="`Improve Training (${unsure.length})`">
          <div>
            <div style="margin: 20px">
              <h3>
                Your bot is not confident of these phrases, please add training:
              </h3>
              <div
                class="flex items-center justify-between my-4"
                v-for="unknown in unsure"
                :key="unknown.id"
              >
                <span class="font-bold  flex-1"
                  >"{{ unknown.statement }}"</span
                >
                <span
                  >Confidence:{{
                    parseFloat(unknown.percentage).toFixed(2)
                  }}</span
                >
                <button @click="deleteUnknown(unknown.id)">
                  Mark as trained
                </button>
                <button @click="addTraining(unknown)">
                  Train Now
                </button>
              </div>
            </div>
          </div>
        </tab>
      </tabs>
    </div>
    <modal name="newintent" height="auto" width="80%">
      <div class="m-10">
        <h2 class="text-4xl">
          Training for statement: "{{ unknown.statement }}"
        </h2>
        <hr />
        <div class="mb-6 m-5">
          <div class="flex flex-col mb-4">
            <label
              class="mb-2 font-bold text-lg text-grey-darkest"
              for="category"
              >*Select a suitable category for this question/statement</label
            >
            <select
              class="border py-2 px-3 text-grey-darkest"
              name="category"
              id="first_name"
              v-model="category"
            >
              <option></option>
              <option>about.bot</option>
              <option>about.user</option>
              <option>greeting</option>
              <option>emoji</option>
              <option>courtesy</option>
              <option>general</option>
            </select>
            <span
              v-if="catError"
              class="text-xs text-red-700"
              id="passwordHelp"
              >{{ catError }}</span
            >
          </div>
          <div class="flex flex-col mb-4">
            <label
              class="mb-2 font-bold text-lg text-grey-darkest"
              for="first_name"
              >*Add a descriptive name so you can find/edit this response in the
              future</label
            >
            <input
              class="border py-2 px-3 text-grey-darkest"
              type="text"
              v-model="description"
              name="first_name"
              id="first_name"
            />
            <span
              v-if="descError"
              class="text-xs text-red-700"
              id="passwordHelp"
              >{{ descError }}</span
            >
          </div>
          <intent-item-details :intent-obj="newintent" />
          <button
            @click="
              createTraining(category, description, newintent, unknown.id)
            "
            class="block uppercase text-lg mx-auto p-4 rounded"
          >
            Create
          </button>
        </div>
      </div>
    </modal>
  </div>
</template>
<script>
import * as axios from 'axios'
import Vue from 'vue'
import '@/style/index.css'
import IntentCategory from '@/components/IntentCategory'
import Tabs from '@/components/Tabs'
import Tab from '@/components/Tab'
import IntentItemDetails from '@/components/IntentItemDetails.vue'
export default {
  name: 'Edit',
  components: {
    IntentCategory,
    Tabs,
    Tab,
    IntentItemDetails
  },
  data() {
    return {
      intents: [],
      categories: [],
      allunknowns: [],
      expanded: false,
      mobileMenuOpen: false,
      newintent: {},
      unknown: {},
      catError: '',
      descError: '',
      addError: '',
      category: '',
      description: ''
    }
  },
  computed: {
    unknowns() {
      return this.allunknowns.filter(t => t.percentage < 0.1)
    },
    unsure() {
      return this.allunknowns
        .filter(t => t.percentage >= 0.1)
        .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage))
    }
  },
  async beforeMount() {
    const aboutBot = {
      name: 'About Bot',
      tooltip:
        'Statements or questions that the user might ask about the bot. e.g. what is your name?',
      childNodes: [],
      edit: false,
      tag: 'about-bot.'
    }
    const aboutUser = {
      name: 'About User',
      tooltip:
        'Statements or questions that the user might say about themselves. e.g. I am bored',
      childNodes: [],
      edit: false,
      tag: 'about-user.'
    }
    const greetings = {
      name: 'Greetings/Goodbyes',
      tooltip: 'How your bot should respond to greetings or goodbyes',
      childNodes: [],
      edit: false,
      tag: 'greeting.'
    }
    const emoji = {
      name: 'Emoji',
      tooltip: 'How your bot should respond to different emojis',
      childNodes: [],
      edit: false,
      tag: 'emoji.'
    }
    const courtesy = {
      name: 'Courtesy',
      tooltip:
        'How your bot should respond when the user responds with kindness e.g. thank you',
      childNodes: [],
      edit: false,
      tag: 'courtesy.'
    }
    const general = {
      name: 'General',
      tooltip: 'For everything else a user might say to your bot',
      childNodes: [],
      edit: false,
      tag: 'general.'
    }
    this.categories = [aboutBot, aboutUser, greetings, emoji, courtesy, general]
    const [data, unknowns] = await Promise.all([
      axios.default.get('/api/intents/list'),
      axios.default.get('/api/intents/list/unknowns')
    ])
    this.intents = this.createDataTree(data.data.map(t => {
        return Object.assign(t, this.emptyItem())
      }))
    this.allunknowns = unknowns.data

    general.childNodes = this.intents.filter(t => t.intent_name.startsWith(general.tag))
    aboutBot.childNodes = this.intents.filter(t => t.intent_name.startsWith(aboutBot.tag))
    aboutUser.childNodes = this.intents.filter(t => t.intent_name.startsWith(aboutUser.tag))
    greetings.childNodes = this.intents.filter(t => t.intent_name.startsWith(greetings.tag))
    emoji.childNodes = this.intents.filter(t => t.intent_name.startsWith(emoji.tag))
    courtesy.childNodes = this.intents.filter(t => t.intent_name.startsWith(courtesy.tag))
  },
  methods: {
    reload() {
      window.location.reload()
    },
    addNew(category) {
      category.edit = true
      category.childNodes.unshift({
        ...this.emptyItem(),
        id: `NEW:${
          category.childNodes.length ? category.childNodes.length + 1 : '1'
        }`,
        user_says: [''],
        bot_says: [''],
        parent: '',
        edit: true,
        dirty: true,
        intent_name: `${category.tag}${
          category.childNodes.length ? category.childNodes.length + 1 : '1'
        }`
      })
    },
    emptyItem() {
      return {
        edit: false,
        dirty: false,
        addFollowUp: intent => {
          if (!intent.output) {
            Vue.$toast.open({
              message:
                'You cant save this until the parent item is saved. Place save this intent before adding a follow up',
              type: 'error',
              duration: 2000
            })
            return
          }
          intent.childNodes.unshift(Object.assign(this.emptyItem(), {
              intent_name: `${intent.intent_name}.${
                intent.childNodes.length ? intent.childNodes.length + 1 : '1'
              }`,
              childNodes: [],
              id: `NEW:${
                intent.childNodes.length ? intent.childNodes.length + 1 : '1'
              }`,
              user_says: [''],
              bot_says: [''],
              edit: true,
              dirty: true,
              parent: intent.output
            }))
          intent.edit = true
        },
        save: async intent => {
          if (!intent.intent_name) {
            Vue.$toast.open({
              message: 'Your intent must have a name',
              type: 'error',
              duration: 2000
            })
            return
          }
          if (intent.dirty) {
            try {
              const updated = await axios.default.post('/api/intents/save',
                intent)
              if (updated && updated.data) {
                intent.id = updated.data.id
                intent.intent_name = updated.data.intent_name
                intent.dirty = false
                Vue.$toast.open({
                  message: `Saved: ${intent.intent_name}`,
                  type: 'success',
                  duration: 2000
                })
              }
            } catch (error) {
              console.log('Err', { error: error.response.data })
              Vue.$toast.open({
                message: `Error: ${error.response.data.details}`,
                type: 'error',
                duration: 2000
              })
              return
            }
          }

          if (intent.childNodes) {
            await Promise.all(intent.childNodes.map(t => t.save(t)))
          }

          return intent
        }
      }
    },
    createDataTree(dataset) {
      const hashTable = Object.create(null)
      dataset.forEach(aData => (hashTable[aData.output || aData.id] = { ...aData, childNodes: [] }))
      const dataTree = []
      dataset.forEach(aData => {
        if (aData.parent) {
          const parent = hashTable[aData.parent]
          if (parent) {
            parent.childNodes.push(hashTable[aData.output || aData.id])
          }
        } else dataTree.push(hashTable[aData.output || aData.id])
      })
      return dataTree
    },
    deleteFromList(list, index) {
      list.splice(index, 1)
    },
    async deleteUnknown(id) {
      const ret = await axios.default.delete(`/api/intents/list/unknowns/id/${id}`)
      if (ret.status === 204) {
        Vue.$toast.open({
          message: 'Marked as trained',
          type: 'success',
          duration: 2000
        })
        this.allunknowns = this.allunknowns.filter(t => t.id !== id)
      }
    },
    addTraining(unknown) {
      console.log(unknown)
      this.catError = ''
      this.descError = ''
      this.addError = ''
      this.category = ''
      this.description = ''
      this.unknown = unknown
      this.newintent = {
        ...this.emptyItem(),
        id: 'NEW:',
        user_says: [unknown.statement.trim()],
        bot_says: [''],
        parent: '',
        edit: true,
        dirty: true,
        intent_name: ''
      }

      this.$modal.show('newintent')
    },
    async createTraining(category, description, item, unknownid) {
      console.log(item, { category, description })
      this.catError = ''
      this.descError = ''
      if (!category) {
        this.catError = 'You must select a category'
        return
      }
      if (!description) {
        this.descError = 'You must enter a description'
        return
      }
      if (!item.bot_says.length || item.bot_says.includes('')) {
        this.descError =
          'Please add 1 or more ways in which your bot should respond'
        return
      }
      if (!item.user_says.length || item.user_says.includes('')) {
        this.descError =
          'Please add 1 or more ways in which a user would say this'
        return
      }
      const intent_name = `${category}.${description}`
      this.newintent = {
        ...item,
        id: `NEW:${intent_name}`,
        intent_name
      }
      const newIntent = await this.newintent.save(this.newintent)
      if (newIntent) {
        // add the intent to the category
        if (unknownid) {
          // delete from unknown list
          await this.deleteUnknown(unknownid)
        }

        this.$modal.hide('newintent')
      }
    },
    addToList(list, text) {
      list.push(text)
    },
    expandCollapseAll() {
      if (this.expanded) {
        this.expanded = false
      } else {
        this.expanded = true
      }
      this.categories.forEach(t => t.edit = this.expanded)
    }
  }
}
</script>
<style>
.input-field {
  background: transparent !important;
}
button {
  border-radius: 8px;
  display: inline-block;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  text-decoration: none;
  text-shadow: 0px 1px 0px #2f6627;
}
button:hover {
  background-color: #5cbf2a;
}
button:active {
  position: relative;
  top: 1px;
}
.intent-head {
  display: flex;
}
</style>
<style lang="sass">
@import '@/style/theme.sass'

body
    margin: 0
    padding: 0
    font-family: var(--font)
    font-display: swap
    background-color: var(--background)
    background-color: #ffffff
    background-attachment: fixed
    background-size: cover

textarea, input
  width:80%

i
    cursor: pointer
</style>
