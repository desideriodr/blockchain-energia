import { ObjectType, Field } from '@nestjs/graphql';
import { DashboardKPI } from '../../analytics/graphql/dashboard-kpi.graphql';
import { TimeSeriesPoint } from './time-series.graphql';

@ObjectType()
export class DashboardHome {
  @Field(() => DashboardKPI)
  kpis: DashboardKPI;

  @Field(() => [TimeSeriesPoint])
  energySeries: TimeSeriesPoint[];

  @Field(() => [TimeSeriesPoint])
  transactionSeries: TimeSeriesPoint[];
}
