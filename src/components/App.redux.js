const ACTIONS = {
	INCREMENT:'App/INCREMENT'
};

export const reducer = (state = 0 , action) => {
	switch (action.type) {
		case ACTIONS.INCREMENT:
			return state + 1;

		default:
			return state;
	}
};

export const actionCreators = {
	increment:() => ({
		type:ACTIONS.INCREMENT
	})
};