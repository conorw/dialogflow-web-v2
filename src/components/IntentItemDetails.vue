<template>
  <div class="item-details">
    <div v-if="intent.intent_name !== 'Default Fallback Intent'">
      <h4>
        What a user might say
        <i
          class="material-icons"
          aria-hidden="true"
          @click="addToList(intent.user_says, '')"
          >add</i
        >
      </h4>
      <div
        v-for="(useritem, idx) in intent.user_says"
        :key="`useritem-${idx}`"
        :index="idx"
        class="response-item"
      >
        <i
          class="material-icons"
          aria-hidden="true"
          @click="$delete(intent.user_says, idx)"
          >delete</i
        >
        <InputField :querystr.sync="intent.user_says[idx]" />
        <!-- <textarea v-model="intent.user_says[i]" /> -->
      </div>
    </div>
    <div>
      <h4>
        How your bot should respond
        <i
          class="material-icons"
          aria-hidden="true"
          @click="addToList(intent.bot_says, '')"
          >add</i
        >
      </h4>
      <div
        v-for="(botitem, i) in intent.bot_says"
        :key="`botitem-${i}`"
        :index="i"
        class="response-item"
      >
        <i
          class="material-icons"
          aria-hidden="true"
          @click="$delete(intent.bot_says, i)"
          >delete</i
        >
        <InputField :querystr.sync="intent.bot_says[`${i}`]" />
      </div>
    </div>
  </div>
</template>

<script>
import InputField from '@/components/InputField'
export default {
  name: 'IntentItem',
  components: {
    InputField
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
    deleteFromList(list, text) {
      const idx = list.findIndex(t => t === text)
      console.log('DELETE ITEM', { list, text })
      // eslint-disable-next-line no-param-reassign
      // list.filter(t => t !== text)
      this.$delete(list, idx)
    },
    addToList(list, text) {
      list.push(text)
    }
  }
}
</script>
<style scoped>
.response-item {
  display: flex;
}
.intent-item {
  margin: 20px;
  padding: 10px;
  border: 2px solid black;
  border-radius: 10px;
}
div.dirty {
  border: 5px solid red;
}
button.dirty {
  background: red;
}
</style>
