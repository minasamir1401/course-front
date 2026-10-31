'use client';
import Image from 'next/image';
import { ArrowUpRight, BookOpen, ChartNoAxesCombined, MessageSquareQuote, Smartphone } from 'lucide-react';
import styles from './LandingStory.module.css';

export function LandingAbout({ ar }: { ar: boolean }) {
  const t = (a: string, e: string) => ar ? a : e;
  return <section id="about" className={styles.about} aria-labelledby="about-title">
    <div className={styles.photo}><Image src="/klevro/photography/saudi-learning-hq.webp" alt={t('طالب وطالبة سعوديان يتعاونان في حل تمرين', 'Two Saudi students working through a learning exercise')} fill quality={90} sizes="(max-width: 760px) 150vw, (max-width: 1300px) 96vw, 1120px"/></div>
    <div className={styles.copy}><p className={styles.eyebrow}>{t('من نحن · KLEVRO', 'ABOUT KLEVRO')}</p><h2 id="about-title">{t('نفهم اليوم. ونستعد لما هو أبعد.', 'Understand today. Prepare for what comes next.')}</h2><p>{t('Klevro منصة تعليمية بالعربية والإنجليزية تربط الدرس بالتدريب، والتقييم بخطوة واضحة للتحسّن. مساحة تجمع الطالب والمعلّم والمدرسة حول هدف واحد: تعلّم نفهم أثره.', 'Klevro connects lessons with practice, and assessment with a clear next step. In Arabic and English, students, teachers and schools share one purpose: learning whose progress you can understand.')}</p><div className={styles.points}><div><BookOpen size={22}/><h3>{t('من الفهم إلى التطبيق', 'From understanding to practice')}</h3><p>{t('شرح وأمثلة وتدريبات تساعدك تختبر فهمك، بدل الاكتفاء بقراءة الدرس.', 'Explanations, examples and exercises help you put each lesson into practice.')}</p></div><div><ChartNoAxesCombined size={22}/><h3>{t('من النتيجة إلى الخطوة التالية', 'From results to your next step')}</h3><p>{t('راجع أداءك، واكتشف ما يحتاج مراجعة، وارجع إلى تعلّمك بهدف أوضح.', 'Review your performance, identify what needs another look and return with a clearer goal.')}</p></div></div><a href="#tracks" className={styles.link}>{t('اكتشف المسارات التعليمية', 'Explore learning pathways')}<ArrowUpRight size={18}/></a></div>
  </section>;
}

export function LandingCommunityPhoto({ ar }: { ar: boolean }) {
  return <div className={styles.communityPhoto}><Image src="/klevro/photography/saudi-teacher-hq.webp" alt={ar ? 'معلّم سعودي يساعد طالبين في فهم تمرين وتطبيقه' : 'A Saudi teacher guides two students through a learning exercise'} fill quality={90} sizes="(max-width: 1000px) 120vw, (max-width: 1300px) 66vw, 840px"/></div>;
}

export function LandingReviews({ ar }: { ar: boolean }) {
  return <section id="community-reviews" className={styles.reviews} aria-labelledby="reviews-title"><div><p className={styles.eyebrow}>{ar ? 'آراء مجتمع KLEVRO' : 'THE KLEVRO COMMUNITY'}</p><h2 id="reviews-title">{ar ? 'تجارب تستحق أن تُروى.' : 'Learning stories worth sharing.'}</h2><p>{ar ? 'مساحة لأصوات الطلاب والمعلّمين والمدارس، وتجاربهم مع التعلّم على Klevro.' : 'A space for students, teachers and schools to share their learning experiences with Klevro.'}</p></div><div className={styles.reviewEmpty}><MessageSquareQuote size={32} aria-hidden="true"/><h3>{ar ? 'تجارب مجتمعنا، قريبًا هنا' : 'Our community’s stories, coming here'}</h3><p>{ar ? 'لم تُنشر آراء بعد. سنشارك التجارب الحقيقية بعد الحصول على موافقة أصحابها.' : 'No reviews have been published yet. Real experiences will appear here with their authors’ permission.'}</p></div></section>;
}

export function LandingAppBanner({ ar }: { ar: boolean }) {
  return <div className={styles.appBanner}><span><Smartphone size={17} aria-hidden="true"/>{ar ? 'مساحة تعلّمك، أقرب إليك على الموبايل والكمبيوتر.' : 'Your learning space, closer on your phone and computer.'}</span><button type="button" onClick={() => window.dispatchEvent(new Event('klevro-install'))}>{ar ? 'ثبّت تطبيق Klevro' : 'Install Klevro'}<ArrowUpRight size={16}/></button></div>;
}
