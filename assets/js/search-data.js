// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "About",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-publications",
          title: "Publications",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-teaching",
          title: "Teaching",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/teaching/";
          },
        },{id: "news-i-am-excited-to-announce-that-i-am-co-organizing-the-21st-conference-on-advances-in-continuous-optimization-europt-2024-set-to-take-place-in-lund-sweden-from-june-26-to-28-2024-for-more-details-visit-the-conference-website",
          title: 'I am excited to announce that I am co-organizing the 21st conference on...',
          description: "",
          section: "News",},{id: "news-the-manuscript-titled-automated-tight-lyapunov-analysis-for-first-order-methods-has-been-accepted-for-publication-in-the-journal-mathematical-programming",
          title: 'The manuscript titled Automated tight Lyapunov analysis for first-order methods has been accepted...',
          description: "",
          section: "News",},{id: "news-i-will-visit-the-sierra-team-at-inria-paris-from-september-2024-until-february-2025",
          title: 'I will visit the Sierra team at Inria Paris from September 2024 until...',
          description: "",
          section: "News",},{id: "news-i-successfully-defended-my-phd-thesis-many-thanks-to-my-opponent-bartolomeo-stellato-and-to-the-examining-committee-tony-stillfjord-ion-necoara-and-masoud-ahookhosh",
          title: 'I successfully defended my PhD thesis. Many thanks to my opponent, Bartolomeo Stellato,...',
          description: "",
          section: "News",},{id: "news-the-manuscript-titled-the-chambolle-pock-method-converges-weakly-with-theta-amp-gt-1-2-and-tau-sigma-l-2-amp-lt-4-1-2-theta-has-been-accepted-for-publication-in-the-journal-optimization-letters",
          title: 'The manuscript titled The Chambolle-Pock method converges weakly with $\theta &amp;amp;gt; 1/2$ and...',
          description: "",
          section: "News",},{id: "news-the-manuscript-titled-a-lyapunov-analysis-of-korpelevich-s-extragradient-method-with-fast-and-flexible-extensions-has-been-accepted-for-publication-in-the-journal-mathematical-programming",
          title: 'The manuscript titled A Lyapunov analysis of Korpelevich’s extragradient method with fast and...',
          description: "",
          section: "News",},{id: "news-i-will-be-a-visiting-scholar-at-the-elliit-focus-period-on-optimization-for-learning-at-lund-university-from-april-20-to-may-22-2026",
          title: 'I will be a visiting scholar at the ELLIIT focus period on optimization...',
          description: "",
          section: "News",},];
