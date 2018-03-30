import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { BrowserRouter, withRouter } from 'react-router-dom';

// redux imports
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import thunk from 'redux-thunk';

// component imports
import App from './components/App';

// import redux stuff
import { reducer, actionCreators } from './components/App.redux';

// load default state
const defaultState = {};

// redux setup
const reducers = combineReducers({
	app: reducer,
});
const store = createStore(reducers, defaultState, applyMiddleware(thunk));

// react-redux connection
const mapStateToProps = state => ({
	counter: state.app.counter,
});
const mapDispatchToProps = dispatch => ({
	increment: () => {
		dispatch(actionCreators.increment());
	},
});
const AppReduxConnected = withRouter(connect(mapStateToProps, mapDispatchToProps)(App));

// render website
const render = Component => {
	const renderResult = (
		<AppContainer>
			<Provider store={store}>
				<BrowserRouter>
					<Component />
				</BrowserRouter>
			</Provider>
		</AppContainer>
	);

	ReactDOM.render(renderResult, document.getElementById('app'));
};
render(AppReduxConnected);

if (module.hot) {
	module.hot.accept('./components/App', () => {
		render(AppReduxConnected);
	});
}
