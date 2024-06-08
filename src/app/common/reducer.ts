import {ActionReducer, Action, State} from '@ngrx/store';

export interface InitialState {
    Name: String;
}

export const intialState = '';

export const nameReducer = (state=intialState, action: any) => {
    switch(action.type) {
        case '[NAME] Set Name': return action.payload;
        default: return state;
    }
}