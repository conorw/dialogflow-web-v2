<template>
  <div
    class="bg-yellow-100 border-l-4 border-indigo-400 rounded px-1 my-2"
    :class="intent.dirty ? 'dirty' : ''"
  >
    <div>
      <div style="display:flex; justify-content: space-between;">
        <span @click="() => (intent.edit = !intent.edit)">
          <h2>
            <i class="material-icons" aria-hidden="true">{{
              intent.edit ? 'expand_less' : 'expand_more'
            }}</i
            >{{ intent.intent_name }}
          </h2>
        </span>
        <div>
          <button
            :class="intent.dirty ? 'dirty' : ''"
            @click="intent.save(intent)"
          >
            <i class="material-icons" aria-hidden="true">save</i> Save
          </button>
          <!-- <button @click="expandCollapseAll()">
            <i class="material-icons" aria-hidden="true">menu_open</i>
          </button> -->
        </div>
      </div>
      <input v-if="intent.edit" v-model="intent.intent_name" type="text" />
    </div>
    <intent-item-details
      :intent-obj="intent"
      v-if="intent.edit"
    ></intent-item-details>
    <hr />
    <div v-if="intent.edit">
      <button @click="intent.addFollowUp(intent)">
        Add Follow Up Question & Response
      </button>
      <IntentItem
        v-for="subintent in intent.childNodes"
        :key="subintent.id"
        :intent-obj="subintent"
      />
    </div>
    <hr />
  </div>
</template>

<script>
import IntentItemDetails from './IntentItemDetails.vue'
export default {
  name: 'IntentItem',
  components: {
    IntentItemDetails
  },
  props: {
    intentObj: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      intent: this.intentObj
    }
  },
  watch: {
    'intent.intent_name': {
      handler() {
        this.intent.dirty = true
      },
      deep: false
    },
    'intent.user_says': {
      handler() {
        this.intent.dirty = true
      },
      deep: true
    },
    'intent.bot_says': {
      handler() {
        this.intent.dirty = true
      },
      deep: true
    }
  },
  methods: {
    expandCollapseAll() {
      this.intent.edit = !this.intent.edit
      if (this.intent.childNodes) {
        this.intent.childNodes.forEach(t => t.edit = this.intent.edit)
      }
    }
  }
}
</script>
<style scoped>
div.dirty {
  border: 5px solid red;
}

button.dirty {
  background: red;
}
</style>
