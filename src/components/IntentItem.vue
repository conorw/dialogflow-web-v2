<template>
    <div class="intent-item" :class="dirty ? 'dirty' : ''">
        <div>
            <div style="display:flex; justify-content: space-between;">
                <h2 @click="()=>intent.edit = !intent.edit"><i class="material-icons" aria-hidden="true">{{intent.edit?'expand_less':'expand_more'}}</i> {{intent.intent_name}}</h2>
                <div>
                    <button @click="saveIntent(intent)"><i class="material-icons" aria-hidden="true">save</i> Save</button>
                    <button @click="addFollowUp(intent)">Add Follow Up</button>
                    <button @click="expandCollapseAll()">Expand/Collapse All</button>
                </div>
            </div>
            <input v-if="intent.edit" v-model="intent.intent_name" type="text">
        </div>
        <div v-if="intent.edit" class="item-details">
            <div v-if="intent.intent_name!=='Default Fallback Intent'">
                <h3>What a user might say <i class="material-icons" aria-hidden="true" @click="addToList(intent.user_says, '')">add</i></h3>
                <div v-for="(useritem, i) in intent.user_says" :key="i" class="response-item">
                    <textarea v-model="intent.user_says[i]" />
                    <i class="material-icons" aria-hidden="true" @click="deleteFromList(intent.user_says, i)">delete</i>
                </div>
            </div>
            <div>
                <h3>How your bot should respond <i class="material-icons" aria-hidden="true" @click="addToList(intent.bot_says, '')">add</i></h3>
                <div v-for="(botitem, i) in intent.bot_says" :key="i" class="response-item">
                    <div>
                        <textarea v-model="intent.bot_says[i]" />
                        <i class="material-icons" aria-hidden="true" @click="deleteFromList(intent.bot_says, i)">delete</i>
                    </div>
                </div>
            </div>
            <IntentItem v-for="(subintent, idx1) in intent.childNodes" :key="idx1" :intent-obj="subintent" />
        </div>
    </div>
</template>

<script>
import * as axios from 'axios'
import Vue from 'vue'
export default {
    name: 'IntentItem',
    props: {
        intentObj: {
            type: Object,
            required: true
        }
    },
    data(){
        return {
            intent: this.intentObj,
            expanded: false,
            dirty: false
        }
    },
    watch:
{
    intent:
  {
      handler()
      {
          this.dirty = true
          console.log(this.dirty)
      },
      deep: true
  }
},
    methods: {
        async saveIntent(intent){
            if (!intent.intent_name){
                alert('Your intent must have a name')
                return
            }
            await axios.default.post('/api/intents/save', intent)
            this.dirty = false
            Vue.$toast.open({message: 'Saved', type: 'success', duration: 2000})
        },
        expandCollapseAll(){
            this.intent.edit = !this.intent.edit
            if (this.intent.childNodes){
                this.intent.childNodes.forEach(t => t.edit = this.intent.edit)
            }
        },
        deleteFromList(list, index){
            list.splice(index, 1)
        },
        addToList(list, text){
            list.push(text)
        },
        addFollowUp(intent){
            intent.childNodes.push({
                intent_name: `${intent.intent_name}.${intent.childNodes.length ? intent.childNodes.length + 1 : '1'}`,
                childNodes: [],
                user_says: [''],
                bot_says: [''],
                edit: true,
                parent: intent.output
            })
        }
    }
}
</script>
<style lang="sass" scoped>

.intent-item
    margin: 20px
    padding: 10px
    border: 5px solid black

.intent-item .dirty
    border: 5px solid red

</style>

