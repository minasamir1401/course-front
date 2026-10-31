import Link from 'next/link';
import Image from 'next/image';
import photos from './LandingLearningPhotos.module.css';
import { ArrowUpRight, BookOpen, Compass, ListChecks, MessageCircle, ShieldCheck, Sparkles, Target } from 'lucide-react';
import styles from './LandingContent.module.css';

export default function LandingLearningSections({ ar }: { ar: boolean }) {
  const txt = (arabic: string, english: string) => ar ? arabic : english;
  const learning = [
    { icon: BookOpen, title: txt('افهم الفكرة', 'Understand the idea'), body: txt('شرح وأمثلة تساعدك تبني فهمك، خطوة بخطوة.', 'Build understanding through explanations and worked examples.') },
    { icon: Target, title: txt('حوّل الفهم إلى تطبيق', 'Put it into practice'), body: txt('تدريبات وواجبات واختبارات قصيرة، بحسب محتوى الدرس.', 'Practise with exercises, assignments and quizzes included in your lesson.') },
    { icon: ListChecks, title: txt('ارجع لما يحتاج مراجعة', 'Make room for review'), body: txt('استفد من النتائج والشروحات المتاحة لتراجع بثقة.', 'Use released results and explanations to guide your review.') },
  ];
  return <>
    <section id="learning-experience" className={`${styles.container} ${styles.learningSection}`} aria-labelledby="learning-title">
      <div className={styles.learningCopy}>
        <p className={styles.kicker}>{txt('داخل تجربة Klevro', 'THE LEARNING EXPERIENCE')}</p>
        <h2 id="learning-title">{txt('من «فهمت الفكرة»', 'From understanding')}<br/><span>{txt('إلى «أقدر أطبّقها».', 'to putting it into practice.')}</span></h2>
        <p className={styles.sectionIntro}>{txt('الدرس مش مجرد محتوى تشاهده. مساحة منظّمة تربط الشرح بالتدريب، وتساعدك ترجع للخطوة اللي تحتاجها.', 'A lesson is more than content to watch. It connects explanations and practice in one organised space, with room to revisit what you need.')}</p>
        <ul className={styles.learningPoints}>{learning.map(({ icon: Icon, title, body }) => <li key={title}><span><Icon size={20} aria-hidden="true"/></span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ul>
        <Link className={styles.editorialLink} href="/login">{txt('اكتشف دروسك المتاحة', 'Explore your available lessons')}<ArrowUpRight size={18} aria-hidden="true"/></Link>
      </div>
      <figure className={`${photos.photo} ${photos.lesson}`}><Image src="/klevro/photography/saudi-practice-hq.webp" alt={txt('طالبة سعودية تتدرّب على الرياضيات باستخدام أدوات تعليمية وجهاز لوحي', 'A Saudi student practising mathematics with learning materials and a tablet')} fill quality={90} sizes="(max-width: 750px) 120vw, (max-width: 1300px) 72vw, 840px"/></figure>
    </section>

    <section id="learning-companion" className={`${styles.container} ${styles.companionSection}`} aria-labelledby="companion-title">
      <div className={styles.companionCopy}><p className={styles.companionKicker}><Sparkles size={16} aria-hidden="true"/>{txt('مساعد Klevro', 'KLEVRO ASSISTANT')}</p><h2 id="companion-title">{txt('سؤالك بداية.', 'Start with a question.')}<br/><span>{txt('وفهمك هو الهدف.', 'Keep understanding in focus.')}</span></h2><p>{txt('مساعدة مرتبطة برحلتك التعليمية: افهم درسًا، راجع نتائجك المتاحة، ورتّب أولويات مذاكرتك بدل ما تبدأ من الصفر كل مرة.', 'Help connected to your learning journey. Explore a lesson, reflect on released results and choose what to practise next.')}</p>
        <div className={styles.companionBenefits}>{[
          { icon: MessageCircle, title: txt('اسأل بطريقتك', 'Ask your way'), text: txt('اكتب سؤالك بالعربي أو بالإنجليزي، وناقش الخطوة الصعبة.', 'Use Arabic or English to talk through a difficult step.') },
          { icon: Compass, title: txt('اعرف خطوتك التالية', 'Find your next step'), text: txt('اقتراحات للمراجعة مبنية على نتائجك ودروسك المتاحة.', 'Review suggestions based on your released results and accessible lessons.') },
          { icon: ShieldCheck, title: txt('مساحة تحترم خصوصيتك', 'Your own learning context'), text: txt('بيانات حسابك متاحة لك بعد الدخول؛ المساعد مخفي أثناء التقييمات.', 'Personal context requires sign-in. The assistant is hidden during assessments.') },
        ].map(({ icon: Icon, title, text }) => <div key={title}><Icon size={19} aria-hidden="true"/><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
      </div>
      <figure className={`${photos.photo} ${photos.companion}`}><Image src="/klevro/photography/saudi-assistant-hq.webp" alt={txt('طالب سعودي يناقش سؤالًا أثناء المذاكرة باستخدام الكمبيوتر وسماعات الرأس', 'A Saudi student discussing a study question using a laptop and headphones')} fill quality={90} sizes="(max-width: 750px) 120vw, (max-width: 1300px) 72vw, 840px"/></figure>
    </section>
  </>;
}
