import { listSimulationDatasets, getSimulationEvents } from "../server/simulationDb";
const datasets = await listSimulationDatasets();
for (const dataset of datasets) {
  const events = await getSimulationEvents(dataset.id);
  console.log(JSON.stringify({ id: dataset.id, name: dataset.name, status: dataset.status, rowCount: dataset.rowCount, validRowCount: dataset.validRowCount, loadedEvents: events.length }));
}
