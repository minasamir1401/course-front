'use client';
import HtmlRenderer from '@/components/HtmlRenderer';
import { aiMarkdownHtml } from '@/lib/aiMarkdown';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './AiAssistant.module.css';
import typography from './AiTypography.module.css';

export default function AiReply({ content }: { content: string }) {
  const { language } = useLanguage();
  return <div lang={language} className={`${styles.reply} ${styles.markdown} ${typography.reply}`}>{content.split(/```(?:[\w+-]+)?\n?([\s\S]*?)```/g).map((part, index) => index % 2
    ? <pre key={index} className={styles.code} dir="ltr"><code>{part}</code></pre>
    : <HtmlRenderer key={index} html={aiMarkdownHtml(part, language === 'ar')}/> )}</div>;
}
