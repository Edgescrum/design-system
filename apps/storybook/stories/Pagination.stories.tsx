import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DEFAULT_PAGE_SIZE, Pagination } from "@edgescrum/peco-ui";

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  args: {
    totalItems: 123,
    pageSize: DEFAULT_PAGE_SIZE,
    currentPage: 1,
    onPageChange: () => {},
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulPagination(props: {
  totalItems: number;
  pageSize: number;
  showSummary?: boolean;
  withTopBorder?: boolean;
}) {
  const [page, setPage] = useState(1);
  return (
    <div className="w-96 rounded-xl bg-card p-4">
      <Pagination {...props} currentPage={page} onPageChange={setPage} />
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <StatefulPagination totalItems={args.totalItems} pageSize={args.pageSize} />
  ),
};

export const WithoutSummary: Story = {
  render: () => (
    <StatefulPagination totalItems={45} pageSize={DEFAULT_PAGE_SIZE} showSummary={false} />
  ),
};

export const WithoutTopBorder: Story = {
  render: () => (
    <StatefulPagination totalItems={45} pageSize={DEFAULT_PAGE_SIZE} withTopBorder={false} />
  ),
};

export const SinglePage: Story = {
  // totalPages <= 1 のときは何も描画しない
  render: () => <StatefulPagination totalItems={5} pageSize={DEFAULT_PAGE_SIZE} />,
};
