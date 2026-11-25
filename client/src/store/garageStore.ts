import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Garage {
  favourites: Record<string,string[]>;
  recent: Record<string,string[]>;
  toggle(user:string,id:string):void;
  visit(user:string,id:string):void;
}
export const useGarage = create(persist<Garage>(set=>({
  favourites:{},recent:{},
  toggle:(user,id)=>set(state=>{
    const items=state.favourites[user] ?? [];
    return {favourites:{...state.favourites,[user]:items.includes(id) ? items.filter(item=>item!==id) : [...items,id]}};
  }),
  visit:(user,id)=>set(state=>({recent:{...state.recent,[user]:[id,...(state.recent[user] ?? []).filter(item=>item!==id)].slice(0,20)}})),
}), {name:'bestbuy-garage'}));
