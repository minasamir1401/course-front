// @ts-nocheck
import React from 'react';
import ExamSlidesBuilder from '@/components/exams/ExamSlidesBuilder';
import { SECTION_STYLE_PRESETS } from '../constants';

export const SlidesBuilder = (props: any) => (
  <ExamSlidesBuilder {...props} SECTION_STYLE_PRESETS={props.SECTION_STYLE_PRESETS || SECTION_STYLE_PRESETS} />
);
