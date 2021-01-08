<template>
    <div>
        <div id="intent-list">
            <h1>Edit all your bot responses</h1><a href="/">Home</a>
            <div v-for="(intent, idx) in intents" :key="idx" class="intent-item">
                <div>
                    <h2>{{intent.intent_name}} <i class="material-icons" aria-hidden="true" @click="toggleEdit(intent)">edit</i></h2>
                    <input v-if="intent.edit" v-model="intent.intent_name" type="text">
                </div>
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
        </div>
    </div>
</template>
<script>
import * as axios from 'axios'
import Vue from 'vue'
export default {
    name: 'Edit',
    data(){
        return {
            intents: []
        }
    },
    async beforeMount(){
        const data = await axios.default.get('/api/intents/list')
        this.intents = data.data.map(t => {
            return {...t, edit: false}
        })
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
        deleteFromList(list, index){
            list.splice(index, 1)
        },
        addToList(list, text){
            list.push(text)
        },
        async saveIntent(intent){
            if (!intent.intent_name){
                alert('Your intent must have a name')
                return
            }
            await axios.default.post('/api/intents/save', intent)
            Vue.$toast.open({message: 'Saved', type: 'success', duration: 2000})
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

.intent-item
    margin: 20px
    padding: 10px
    border: 5px solid black

textarea
  width:80%

</style>

