import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { getPageConfig } from "../data/sitePages";
import ContentPage from "./ContentPage";

const GenericContentPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const config = slug ? getPageConfig("/" + slug) : undefined;

  if (!config) {
    return <Navigate to="/" replace />;
  }

  return <ContentPage key={slug} config={config} />;
};

export default GenericContentPage;
