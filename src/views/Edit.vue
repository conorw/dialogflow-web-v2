<template>
    <div>
        <div id="intent-list">
            <h1>Edit all your bot responses</h1><a href="/">Home</a>
            <button @click="expandCollapseAll()">Expand/Collapse All</button>
            <IntentItem v-for="(intent, idx) in intents" :key="idx" :intent-obj="intent" />
            <!-- <div v-for="(intent, idx) in intents" :key="idx" class="intent-item">
                <div>
                    <h2>{{intent.intent_name}} <i class="material-icons" aria-hidden="true" @click="()=>intent.edit = !intent.edit">edit</i></h2>
                    <input v-if="intent.edit" v-model="intent.intent_name" type="text">
                    {{intent.parent}}
                </div>
                <div v-if="intent.edit" class="item-details">
                    <div v-if="intent.intent_name!=='Default Fallback Intent'">
                        <h3>User Says <i class="material-icons" aria-hidden="true" @click="addToList(intent.user_says, '')">add</i></h3>
                        <div v-for="(useritem, i) in intent.user_says" :key="i" class="response-item">
                            <textarea v-model="intent.user_says[i]" />
                            <i class="material-icons" aria-hidden="true" @click="deleteFromList(intent.user_says, i)">delete</i>
                        </div>
                    </div>
                    <div>
                        <h3>Bot Says <i class="material-icons" aria-hidden="true" @click="addToList(intent.bot_says, '')">add</i></h3>
                        <div v-for="(botitem, i) in intent.bot_says" :key="i" class="response-item">
                            <div>
                                <textarea v-model="intent.bot_says[i]" />
                                <i class="material-icons" aria-hidden="true" @click="deleteFromList(intent.bot_says, i)">delete</i>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <button @click="saveIntent(intent)"><i class="material-icons" aria-hidden="true">save</i> Save</button>
                </div>
            </div> -->
        </div>
    </div>
</template>
<script>
import * as axios from 'axios'
import IntentItem from '@/components/IntentItem'
export default {
    name: 'Edit',
    components: {
        IntentItem
    },
    data(){
        return {
            intents: [],
            expanded: false
        }
    },
    async beforeMount(){
        const data = await axios.default.get('/api/intents/list')
        this.intents = this.createDataTree(data.data.map(t => {
            return {...t, edit: false}
        }))
    },
    methods: {
        toggleEdit(intent){
            console.log(intent.edit)
            if (!intent.edit){
                intent.edit = true
            } else {
                intent.edit = !intent.edit
            }
            console.log(intent.edit)
            return intent
        },
        createDataTree(dataset){
            const hashTable = Object.create(null)
            dataset.forEach(aData => hashTable[aData.output || aData.id] = {...aData, childNodes: []})
            const dataTree = []
            dataset.forEach(aData => {
                if (aData.parent){
                    const parent = hashTable[aData.parent]
                    if (parent){
                        parent.childNodes.push(hashTable[aData.output || aData.id])
                    }
                }
                else dataTree.push(hashTable[aData.output || aData.id])
            })
            console.log(dataTree)
            return dataTree
        },
        deleteFromList(list, index){
            list.splice(index, 1)
        },
        addToList(list, text){
            list.push(text)
        },
        expandCollapseAll(){
            if (this.expanded){
                this.expanded = false
            } else {
                this.expanded = true
            }
            this.intents.forEach(t => t.edit = this.expanded)
        }
    }
}
</script>
<style lang="sass">
@import '@/style/theme.sass'

body
    margin: 0
    padding: 0
    font-family: var(--font)
    font-display: swap
    height: 100vh
    width: 100vw
    background-color: var(--background)
    background-color: #ffffff
    background-attachment: fixed
    background-size: cover

textarea, input
  width:80%

i
    cursor: pointer
</style>

