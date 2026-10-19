/* Short, source-checked excerpts. Arabic text is a translation, never a claim of endorsement. */
(function(root){'use strict';
const jobs='https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says';
const pg='https://www.paulgraham.com/startupideas.html';
const bezos15='https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Annual-Report.pdf';
const bezos97='https://www.aboutamazon.com/news/company-news/amazons-original-1997-letter-to-shareholders';
const gates='https://www.gatesnotes.com/Accelerating-Innovation';
const investor=[
 {en:'Make something people want.',ar:'اصنع شيئًا يريده الناس.',authorEn:'Paul Graham',authorAr:'بول غراهام',year:'2008',url:'https://paulgraham.com/good.html'},
 {en:'To invent you have to experiment.',ar:'لكي تبتكر، عليك أن تجرّب.',authorEn:'Jeff Bezos',authorAr:'جيف بيزوس',year:'2015',url:bezos15},
 {en:'The public sector’s investments unlock the private sector’s ingenuity.',ar:'استثمارات القطاع العام تُطلق إبداع القطاع الخاص.',authorEn:'Bill Gates',authorAr:'بيل غيتس',year:'2016',url:gates},
 {en:'Do things that don’t scale.',ar:'ابدأ بأعمال لا تقبل التوسّع آليًا.',authorEn:'Paul Graham',authorAr:'بول غراهام',year:'2013',url:'https://paulgraham.com/ds.html'},
 {en:'It’s All About the Long Term.',ar:'الأمر كله يتعلّق بالمدى الطويل.',authorEn:'Jeff Bezos',authorAr:'جيف بيزوس',year:'1997',url:bezos97},
 {en:'You can’t connect the dots looking forward.',ar:'لا يمكنك وصل النقاط وأنت تنظر إلى الأمام.',authorEn:'Steve Jobs',authorAr:'ستيف جوبز',year:'2005',url:jobs},
 {en:'Live in the future and build what seems interesting.',ar:'عِش في المستقبل، وابنِ ما يبدو مثيرًا للاهتمام.',authorEn:'Paul Graham',authorAr:'بول غراهام',year:'2012',url:pg},
 {en:'Failure and invention are inseparable twins.',ar:'الفشل والابتكار توأمان لا ينفصلان.',authorEn:'Jeff Bezos',authorAr:'جيف بيزوس',year:'2015',url:bezos15},
 {en:'No business plan survives first contact with customers.',ar:'لا تصمد خطة عمل أمام أول احتكاك بالعملاء.',authorEn:'Steve Blank',authorAr:'ستيف بلانك',year:'2010',url:'https://steveblank.com/2010/05/17/'},
 {en:'The only way to do great work is to love what you do.',ar:'السبيل الوحيد لإنجاز عمل عظيم هو أن تحب ما تفعله.',authorEn:'Steve Jobs',authorAr:'ستيف جوبز',year:'2005',url:jobs},
 {en:'We will continue to learn from both our successes and our failures.',ar:'سنواصل التعلّم من نجاحاتنا وإخفاقاتنا معًا.',authorEn:'Jeff Bezos',authorAr:'جيف بيزوس',year:'1997',url:bezos97},
 {en:'Look for problems, preferably problems you have yourself.',ar:'ابحث عن المشكلات، ويُفضّل أن تكون مشكلات تواجهها بنفسك.',authorEn:'Paul Graham',authorAr:'بول غراهام',year:'2012',url:pg},
 {en:'Innovation starts with government support for the research labs and universities.',ar:'يبدأ الابتكار بدعم حكومي للمختبرات البحثية والجامعات.',authorEn:'Bill Gates',authorAr:'بيل غيتس',year:'2016',url:gates},
 {en:'Outsized returns often come from betting against conventional wisdom.',ar:'العوائد الاستثنائية كثيرًا ما تأتي من الرهان خلافًا للحكمة السائدة.',authorEn:'Jeff Bezos',authorAr:'جيف بيزوس',year:'2015',url:bezos15},
 {en:'Stay hungry. Stay foolish.',ar:'ابقَ متعطّشًا، واحتفظ بجرأة المغامرة.',authorEn:'Steve Jobs, quoting the Whole Earth Catalog',authorAr:'ستيف جوبز، ناقلًا عبارة كتالوج الأرض الكامل',year:'2005',url:jobs}
];
const research=[
 {en:'Testing is a powerful means of improving learning, not just assessing it.',ar:'الاختبار وسيلة قوية لتحسين التعلّم، وليس لتقييمه فقط.',authorEn:'Roediger & Karpicke',authorAr:'روديغر وكاربيك',year:'2006',url:'https://pubmed.ncbi.nlm.nih.gov/16507066/'},
 {en:'Practice testing and distributed practice received high utility assessments.',ar:'حصل الاختبار التدريبي والممارسة الموزّعة على تقييم مرتفع للجدوى.',authorEn:'Dunlosky et al.',authorAr:'دنلوسكي وآخرون',year:'2013',url:'https://doi.org/10.1177/1529100612453266'},
 {en:'Retrieval practice produces more learning than elaborative studying with concept mapping.',ar:'تنتج ممارسة الاسترجاع تعلّمًا أكبر من الدراسة التفصيلية باستخدام خرائط المفاهيم.',authorEn:'Karpicke & Blunt · study title',authorAr:'كاربيك وبلانت · من عنوان الدراسة',year:'2011',url:'https://pubmed.ncbi.nlm.nih.gov/21252317/'},
 {en:'Feedback is one of the most powerful influences on learning and achievement, but this impact can be either positive or negative.',ar:'التغذية الراجعة من أقوى المؤثرات في التعلّم والتحصيل، لكن أثرها قد يكون إيجابيًا أو سلبيًا.',authorEn:'Hattie & Timperley',authorAr:'هاتي وتيمبرلي',year:'2007',url:'https://doi.org/10.3102/003465430298487'}
];
root.LEXLEARN_CONFERENCE_CITATIONS={investor,research};
})(window);
