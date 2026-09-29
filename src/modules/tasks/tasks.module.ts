import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OverdueTask } from './overdue.task';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [OverdueTask],
})
export class TasksModule {}
