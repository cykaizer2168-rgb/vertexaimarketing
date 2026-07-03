import Layout from "./components/Layout";
import Home from "./pages/Home";
import CaseStudy from "./pages/CaseStudy";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Privacy from "./pages/Privacy";
import AboutPage from "./pages/About";
import Contact from "./pages/Contact";
import ProjectCaseStudy from "./pages/ProjectCaseStudy";
import { fetchPublishedCaseStudies, fetchCaseStudy } from "./data/caseStudies";
import { fetchPublishedPosts, fetchPost } from "./data/posts";
import { projects } from "./data/projects";

export const routes = [
  {
    path: "/",
    element: <Layout />,
    entry: "src/components/Layout.jsx",
    children: [
      {
        index: true,
        Component: Home,
        entry: "src/pages/Home.jsx",
        loader: async () => ({ caseStudies: await fetchPublishedCaseStudies() }),
      },
      {
        path: "case-studies/:slug",
        Component: CaseStudy,
        entry: "src/pages/CaseStudy.jsx",
        loader: async ({ params }) => ({ caseStudy: await fetchCaseStudy(params.slug) }),
        getStaticPaths: async () => {
          const list = await fetchPublishedCaseStudies();
          return list.map((c) => `case-studies/${c.slug}`);
        },
      },
      {
        path: "blog",
        Component: Blog,
        entry: "src/pages/Blog.jsx",
        loader: async () => ({ posts: await fetchPublishedPosts() }),
      },
      {
        path: "blog/:slug",
        Component: BlogPost,
        entry: "src/pages/BlogPost.jsx",
        loader: async ({ params }) => ({ post: await fetchPost(params.slug) }),
        getStaticPaths: async () => {
          const list = await fetchPublishedPosts();
          return list.map((p) => `blog/${p.slug}`);
        },
      },
      {
        path: "projects/:slug",
        Component: ProjectCaseStudy,
        entry: "src/pages/ProjectCaseStudy.jsx",
        getStaticPaths: () => projects.map((p) => `projects/${p.slug}`),
      },
      { path: "about", Component: AboutPage, entry: "src/pages/About.jsx" },
      { path: "contact", Component: Contact, entry: "src/pages/Contact.jsx" },
      { path: "privacy", Component: Privacy, entry: "src/pages/Privacy.jsx" },
    ],
  },
];
