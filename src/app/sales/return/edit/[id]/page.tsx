import EditReturnPage from "@/app/components/Sales/return/EditPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  console.log("Return edit route params:", resolvedParams);

  return <EditReturnPage params={resolvedParams} />;
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;

  return {
    title: `Edit Return/BS #${resolvedParams.id} - PERUSAHAAN`,
    description: `Edit data return atau barang susut dengan ID ${resolvedParams.id}`,
  };
}
