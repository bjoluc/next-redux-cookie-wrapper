import {
	ActionCreator,
	AnyAction,
	PayloadAction,
	ThunkAction,
	configureStore,
	createSlice,
} from "@reduxjs/toolkit";
import delay from "delay";
import {nextReduxCookieMiddleware, wrapMakeStore} from "next-redux-cookie-wrapper";
import {HYDRATE, createWrapper} from "next-redux-wrapper";
import {useDispatch} from "react-redux";

export const pageSlice = createSlice({
	name: "page",

	initialState: {title: "", subtitle: "", counter: 0, locale: "en"},

	reducers: {
		increaseCounter(state) {
			state.counter += 1;
		},
		setTitle(state, {payload}: PayloadAction<{title: string; subtitle: string}>) {
			state.counter += 1;
			Object.assign(state, payload);
		},
		setLocale(state, {payload}: PayloadAction<string>) {
			state.locale = payload;
		},
	},

	extraReducers: {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		[HYDRATE]: (state, {payload}) => ({
			...state,
			...payload.page,
		}),
	},
});

export const setTitleWithDelay: ActionCreator<AppThunkAction> =
	(title: string, subtitle: string) => async (dispatch) => {
		await delay(300);
		dispatch(pageSlice.actions.setTitle({title, subtitle}));
	};

export const selectPage = (state: AppState) => state[pageSlice.name];

const makeStore = wrapMakeStore(() =>
	configureStore({
		reducer: {
			[pageSlice.name]: pageSlice.reducer,
		},
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware().prepend(
				nextReduxCookieMiddleware({
					subtrees: [
						`${pageSlice.name}.counter`,
						{
							subtree: `${pageSlice.name}.locale`,
							cookieName: "NEXT_LOCALE",
							serializationFunction: String,
							deserializationFunction: String,
							defaultState: pageSlice.getInitialState().locale,
						},
					],
				})
			),
	})
);

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunkAction<ReturnType = Promise<void>> = ThunkAction<
	ReturnType,
	AppState,
	unknown,
	AnyAction
>;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export const wrapper = createWrapper<AppStore>(makeStore, {debug: true});
