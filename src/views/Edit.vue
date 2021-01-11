<template>
    <div>
        <div id="intent-list">
            <div class="intent-head">
                <h1>Bot Personality</h1>
                <button><a href="/">Home</a></button>
                <button @click="reload">Undo Changes</button>
            </div>
            <hr>
            <button @click="expandCollapseAll()"><i class="material-icons" aria-hidden="true">menu_open</i></button>
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
import Vue from 'vue'
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
            return Object.assign(t, this.emptyItem())
        }))
    },
    methods: {
        reload(){
            window.location.reload()
        },
        emptyItem(){
            return {
                edit: false,
                dirty: false,
                addFollowUp: intent => {
                    if (!intent.output){
                        Vue.$toast.open({message: 'Place save this intent before adding a follow up', type: 'error', duration: 2000})
                        return
                    }
                    intent.childNodes.push(Object.assign(this.emptyItem(), {
                        intent_name: `${intent.intent_name}.${intent.childNodes.length ? intent.childNodes.length + 1 : '1'}`,
                        childNodes: [],
                        user_says: [''],
                        bot_says: [''],
                        edit: true,
                        dirty: true,
                        parent: intent.output
                    }))
                    intent.edit = true
                },
                save: async intent => {
                    if (!intent.intent_name){
                        Vue.$toast.open({message: 'Your intent must have a name', type: 'error', duration: 2000})
                        return
                    }
                    if (intent.dirty){
                        try {
                            const updated = await axios.default.post('/api/intents/save', intent)
                            if (updated && updated.data){
                                console.log(intent)
                                intent.id = updated.data.id
                                intent.dirty = false
                                Vue.$toast.open({message: `Saved: ${intent.intent_name}`, type: 'success', duration: 2000})
                            }
                        } catch (error){
                            console.log('Err', {error: error.response.data})
                            Vue.$toast.open({message: `Error: ${error.response.data.details}`, type: 'error', duration: 2000})
                            return
                        }
                    }

                    Promise.all(intent.childNodes.map(t => t.save(t)))
                }
            }
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
<style>
button {
	background-color:#44c767;
	border-radius:8px;
	border:1px solid #18ab29;
	display:inline-block;
	cursor:pointer;
	color:#ffffff;
	font-family:Arial;
	font-size:14px;
    height: 50px;
    margin: 5px;
	padding:4px 8px;
	text-decoration:none;
	text-shadow:0px 1px 0px #2f6627;
}
button:hover {
	background-color:#5cbf2a;
}
button:active {
	position:relative;
	top:1px;
}
.intent-head{
    display:flex;
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
