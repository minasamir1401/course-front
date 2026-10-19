"use client";
import { useExamModulePortalState } from "./useExamModulePortalState";
import ExamModulePortalView from "./ExamModulePortalView";
export default function ExamModulePortal(props: any) { const state = useExamModulePortalState(props); if (!("state" in state)) return state; return <ExamModulePortalView {...state} />; }
