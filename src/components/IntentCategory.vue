<template>
    <div class="bg-yellow-100 border-l-4 border-purple-400 rounded px-6" :class="category.dirty ? 'dirty' : ''">

        <div class="flex items-center justify-between my-4">
            <h2 @click="()=>category.edit = !category.edit">
                <i class="material-icons" aria-hidden="true">{{category.edit?'expand_less':'expand_more'}}</i> {{category.name}} <span class="tooltip"><i class="material-icons" aria-hidden="true">info</i>
                    <span class="tooltiptext">{{category.tooltip}}</span>
                </span>
            </h2>
            <div>
                <button @click="()=>$emit('add-new', category)">Add New "{{category.name}}" item<i class="material-icons" aria-hidden="true">library_add</i></button>
                <!-- <button @click="expandCollapseAll()"><i class="material-icons" aria-hidden="true">menu_open</i></button> -->
            </div>
        </div>

        <div v-if="category.edit" class="item-details">
            <input v-model="search" style="height: 30px; width: 30%;" type="text" placeholder="Filter...">
            <IntentItem v-for="(subintent) in filteredList" :key="subintent.id" :intent-obj="subintent" />
        </div>
    </div>
</template>

<script>
import IntentItem from '@/components/IntentItem'
export default {
    name: 'IntentCategory',
    components: {
        IntentItem
    },
    props: {
        categoryObj: {
            type: Object,
            required: true
        }
    },
    data(){
        return {
            category: this.categoryObj,
            search: ''
        }
    },
    computed: {
        filteredList(){
            if (!this.search){
                return this.category.childNodes
            }
            return this.category.childNodes.filter(t => t.intent_name.toLowerCase().includes(this.search.toLowerCase()))
        }
    },
    methods: {
        expandCollapseAll(){
            this.category.edit = !this.category.edit
            if (this.category.childNodes){
                this.category.childNodes.forEach(t => t.edit = this.intent.edit)
            }
        }
    }
}
</script>
<style scoped>



/* Tooltip container */
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black; /* If you want dots under the hoverable text */
}

/* Tooltip text */
.tooltip .tooltiptext {
  visibility: hidden;
  width: 150px;
  font-size: medium;
  background-color: yellow;
  color: black;
  text-align: center;
  padding: 5px;
  border-radius: 6px;
  /* Position the tooltip text - see examples below! */
  position: absolute;
  z-index: 1;
}

/* Show the tooltip text when you mouse over the tooltip container */
.tooltip:hover .tooltiptext {
  visibility: visible;
}
</style>

