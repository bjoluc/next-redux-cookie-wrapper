import {GetServerSidePropsContext, NextPageContext} from "next";
import {Context} from "next-redux-wrapper";
import {AppContext} from "next/app";
import {SetRequired} from "type-fest";

export const isClient = () => typeof window !== "undefined";

/**
 * Returns whether the provided context is a `GetServerSidePropsContext` or a `PageContext` with
 * `req` and `res` set.
 */
export const isSsrContext = (
	context: Context
): context is GetServerSidePropsContext | SetRequired<NextPageContext, "req" | "res"> =>
	(context as GetServerSidePropsContext).req !== undefined &&
	(context as GetServerSidePropsContext).res !== undefined;

/**
 * Returns whether the provided context is an `AppContext`.
 */
export const isAppContext = (context: Context): context is AppContext =>
	(context as AppContext).ctx !== undefined;
