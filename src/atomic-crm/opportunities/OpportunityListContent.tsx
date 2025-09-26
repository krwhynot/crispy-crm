import type { OnDragEndResponder } from "@hello-pangea/dnd";
import { DragDropContext } from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
import type { DataProvider } from "ra-core";
import { useDataProvider, useListContext } from "ra-core";
import { useEffect, useState } from "react";

import type { Opportunity } from "../types";
import { OpportunityColumn } from "./OpportunityColumn";
import { OPPORTUNITY_STAGES_LEGACY } from "./stageConstants";
import type { OpportunitiesByStage } from "./stages";
import { getOpportunitiesByStage } from "./stages";

export const OpportunityListContent = () => {
  const opportunityStages = OPPORTUNITY_STAGES_LEGACY;

  const {
    data: unorderedOpportunities,
    isPending,
    refetch,
  } = useListContext<Opportunity>();
  const dataProvider = useDataProvider();

  const [opportunitiesByStage, setOpportunitiesByStage] =
    useState<OpportunitiesByStage>(
      getOpportunitiesByStage([], opportunityStages),
    );

  useEffect(() => {
    if (unorderedOpportunities) {
      const newOpportunitiesByStage = getOpportunitiesByStage(
        unorderedOpportunities,
        opportunityStages,
      );
      if (!isEqual(newOpportunitiesByStage, opportunitiesByStage)) {
        setOpportunitiesByStage(newOpportunitiesByStage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unorderedOpportunities]);

  if (isPending) return null;

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStage = source.droppableId;
    const destinationStage = destination.droppableId;
    const sourceOpportunity = opportunitiesByStage[sourceStage][source.index]!;
    const destinationOpportunity = opportunitiesByStage[destinationStage][
      destination.index
    ] ?? {
      stage: destinationStage,
      index: undefined, // undefined if dropped after the last item
    };

    // compute local state change synchronously
    setOpportunitiesByStage(
      updateOpportunityStageLocal(
        sourceOpportunity,
        { stage: sourceStage, index: source.index },
        { stage: destinationStage, index: destination.index },
        opportunitiesByStage,
      ),
    );

    // persist the changes
    updateOpportunityStage(
      sourceOpportunity,
      destinationOpportunity,
      dataProvider,
    ).then(() => {
      refetch();
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4">
        {opportunityStages.map((stage) => (
          <OpportunityColumn
            stage={stage.value}
            opportunities={opportunitiesByStage[stage.value]}
            key={stage.value}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

const updateOpportunityStageLocal = (
  sourceOpportunity: Opportunity,
  source: { stage: string; index: number },
  destination: {
    stage: string;
    index?: number; // undefined if dropped after the last item
  },
  opportunitiesByStage: OpportunitiesByStage,
) => {
  if (source.stage === destination.stage) {
    // moving opportunity inside the same column
    const column = opportunitiesByStage[source.stage];
    column.splice(source.index, 1);
    column.splice(destination.index ?? column.length + 1, 0, sourceOpportunity);
    return {
      ...opportunitiesByStage,
      [destination.stage]: column,
    };
  } else {
    // moving opportunity across columns
    const sourceColumn = opportunitiesByStage[source.stage];
    const destinationColumn = opportunitiesByStage[destination.stage];
    sourceColumn.splice(source.index, 1);
    destinationColumn.splice(
      destination.index ?? destinationColumn.length + 1,
      0,
      sourceOpportunity,
    );
    return {
      ...opportunitiesByStage,
      [source.stage]: sourceColumn,
      [destination.stage]: destinationColumn,
    };
  }
};

const updateOpportunityStage = async (
  source: Opportunity,
  destination: {
    stage: string;
    index?: number; // undefined if dropped after the last item
  },
  dataProvider: DataProvider,
) => {
  if (source.stage === destination.stage) {
    // moving opportunity inside the same column
    // Fetch all the opportunities in this stage (because the list may be filtered, but we need to update even non-filtered opportunities)
    const { data: columnOpportunities } = await dataProvider.getList(
      "opportunities",
      {
        sort: { field: "index", order: "ASC" },
        pagination: { page: 1, perPage: 100 },
        filter: { stage: source.stage },
      },
    );
    const destinationIndex =
      destination.index ?? columnOpportunities.length + 1;

    if (source.index > destinationIndex) {
      // opportunity moved up, eg
      // dest   src
      //  <------
      // [4, 7, 23, 5]
      await Promise.all([
        // for all opportunities between destinationIndex and source.index, increase the index
        ...columnOpportunities
          .filter(
            (opportunity) =>
              opportunity.index >= destinationIndex &&
              opportunity.index < source.index,
          )
          .map((opportunity) =>
            dataProvider.update("opportunities", {
              id: opportunity.id,
              data: { index: opportunity.index + 1 },
              previousData: opportunity,
            }),
          ),
        // for the opportunity that was moved, update its index
        dataProvider.update("opportunities", {
          id: source.id,
          data: { index: destinationIndex },
          previousData: source,
        }),
      ]);
    } else {
      // opportunity moved down, e.g
      // src   dest
      //  ------>
      // [4, 7, 23, 5]
      await Promise.all([
        // for all opportunities between source.index and destinationIndex, decrease the index
        ...columnOpportunities
          .filter(
            (opportunity) =>
              opportunity.index <= destinationIndex &&
              opportunity.index > source.index,
          )
          .map((opportunity) =>
            dataProvider.update("opportunities", {
              id: opportunity.id,
              data: { index: opportunity.index - 1 },
              previousData: opportunity,
            }),
          ),
        // for the opportunity that was moved, update its index
        dataProvider.update("opportunities", {
          id: source.id,
          data: { index: destinationIndex },
          previousData: source,
        }),
      ]);
    }
  } else {
    // moving opportunity across columns
    // Fetch all the opportunities in both stages (because the list may be filtered, but we need to update even non-filtered opportunities)
    const [{ data: sourceOpportunities }, { data: destinationOpportunities }] =
      await Promise.all([
        dataProvider.getList("opportunities", {
          sort: { field: "index", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          filter: { stage: source.stage },
        }),
        dataProvider.getList("opportunities", {
          sort: { field: "index", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          filter: { stage: destination.stage },
        }),
      ]);
    const destinationIndex =
      destination.index ?? destinationOpportunities.length + 1;

    await Promise.all([
      // decrease index on the opportunities after the source index in the source columns
      ...sourceOpportunities
        .filter((opportunity) => opportunity.index > source.index)
        .map((opportunity) =>
          dataProvider.update("opportunities", {
            id: opportunity.id,
            data: { index: opportunity.index - 1 },
            previousData: opportunity,
          }),
        ),
      // increase index on the opportunities after the destination index in the destination columns
      ...destinationOpportunities
        .filter((opportunity) => opportunity.index >= destinationIndex)
        .map((opportunity) =>
          dataProvider.update("opportunities", {
            id: opportunity.id,
            data: { index: opportunity.index + 1 },
            previousData: opportunity,
          }),
        ),
      // change the dragged opportunity to take the destination index and column
      dataProvider.update("opportunities", {
        id: source.id,
        data: {
          index: destinationIndex,
          stage: destination.stage,
        },
        previousData: source,
      }),
    ]);
  }
};
