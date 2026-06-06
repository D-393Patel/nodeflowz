"use client";

import { formatDistanceToNow } from "date-fns";
import {
  EmptyView,
  EntityContainer,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
  LoadingView,
} from "@/components/entity-components";
import {
  useCreateWorkflow,
  useRemoveWorkflow,
  useSuspenseWorkflows,
} from "../hooks/use-workflows";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useRouter } from "next/navigation";
import { useWorkflowsParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";
import type { Workflow } from "@/generated/prisma";
import { LayoutTemplateIcon, PlusIcon, WorkflowIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

export const WorkflowSearch = () => {
  const [params, setParams] = useWorkflowsParams();
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams,
  });

  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search workflows"
    />
  );
};

export const WorkfowsList = () => {
  const workflows = useSuspenseWorkflows();

  return (
    <EntityList
      items={workflows.data.items}
      getKey={(workflow) => workflow.id}
      renderItem={(workflow) => <WorkflowItem data={workflow} />}
      emptyView={<WorkflowsEmpty />}
    />
  );
};

export const WorkflowsHeader = ({ disabled }: { disabled?: boolean }) => {
  const createWorkflow = useCreateWorkflow();
  const router = useRouter();
  const { handleError, modal } = useUpgradeModal();

  const handleCreateBlank = () => {
    createWorkflow.mutate(undefined, {
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`);
      },
      onError: (error) => {
        handleError(error);
      },
    });
  };

  const handleCreateTemplate = () => {
    createWorkflow.mutate(
      { template: "tinyfish_hn_to_sheets" },
      {
        onSuccess: (data) => {
          router.push(`/workflows/${data.id}`);
        },
        onError: (error) => {
          handleError(error);
        },
      },
    );
  };

  return (
    <>
      {modal}
      <div className="flex flex-row items-center justify-between gap-x-4">
        <div className="flex flex-col">
          <h1 className="text-lg md:text-xl font-semibold">Workflows</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Create and manage your workflows
          </p>
        </div>
        <ButtonGroup>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCreateTemplate}
            disabled={createWorkflow.isPending || disabled}
          >
            <LayoutTemplateIcon className="size-4" />
            HN Template
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCreateBlank}
            disabled={createWorkflow.isPending || disabled}
          >
            <PlusIcon className="size-4" />
            New workflow
          </Button>
        </ButtonGroup>
      </div>
    </>
  );
};

export const WorkflowsPagination = () => {
  const workflows = useSuspenseWorkflows();
  const [params, setParams] = useWorkflowsParams();

  return (
    <EntityPagination
      disabled={workflows.isFetching}
      totalPages={workflows.data.totalPages}
      page={workflows.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const WorkflowsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<WorkflowsHeader />}
      search={<WorkflowSearch />}
      pagination={<WorkflowsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const WorkflowsLoading = () => {
  return <LoadingView message="Loading workflows..." />;
};

export const WorkflowsError = () => {
  return <ErrorView message="Error Loading workflows..." />;
};

export const WorkflowsEmpty = () => {
  const router = useRouter();
  const createWorkflow = useCreateWorkflow();
  const { handleError, modal } = useUpgradeModal();

  const handleCreate = () => {
    createWorkflow.mutate(undefined, {
      onError: (error) => {
        handleError(error);
      },
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`);
      },
    });
  };

  const handleCreateTemplate = () => {
    createWorkflow.mutate(
      { template: "tinyfish_hn_to_sheets" },
      {
        onError: (error) => {
          handleError(error);
        },
        onSuccess: (data) => {
          router.push(`/workflows/${data.id}`);
        },
      },
    );
  };

  return (
    <>
      {modal}
      <div className="flex flex-col gap-y-4">
        <EmptyView
          onNew={handleCreate}
          message="You haven’t created any workflows yet. Create your first workflow to get started."
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCreateTemplate}
          disabled={createWorkflow.isPending}
        >
          <LayoutTemplateIcon className="size-4" />
          Create Hacker News Template
        </Button>
      </div>
    </>
  );
};

export const WorkflowItem = ({
  data,
}: {
  data: Workflow;
}) => {
  const removeWorkflow = useRemoveWorkflow();

  const handleRemove = () => {
    removeWorkflow.mutate({ id: data.id });
  };

  return (
    <EntityItem
      href={`/workflows/${data.id}`}
      title={data.name}
      subtitle={
        <>
          Updated {formatDistanceToNow(data.updatedAt)}
          {""}
          &bull; Created{" "}
          {formatDistanceToNow(data.createdAt, { addSuffix: true })}
        </>
      }
      image={
        <div className="size-8 flex items-center justify-center">
          <WorkflowIcon className="size-5 text-muted-foreground" />
        </div>
      }
      onRemove={handleRemove}
      isRemoving={removeWorkflow.isPending}
    />
  );
};
