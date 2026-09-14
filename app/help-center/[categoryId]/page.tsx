import { HelpCenterClient } from "@/components/help-center-client";

type HelpCenterCategoryPageProps = {
  params: Promise<{
    categoryId: string;
  }>;
};

export default async function HelpCenterCategoryPage({
  params,
}: HelpCenterCategoryPageProps) {
  const { categoryId } = await params;

  return <HelpCenterClient categoryId={categoryId} key={categoryId} />;
}
