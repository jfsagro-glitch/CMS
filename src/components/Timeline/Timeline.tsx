import React from 'react';
import { Timeline as AntTimeline, Tag, Typography, Space } from 'antd';
import type { TimelineEvent } from '@/types/timeline';
import { TIMELINE_EVENT_TYPES } from '@/types/timeline';
import './Timeline.css';

const { Text } = Typography;

interface TimelineProps {
  events: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="timeline-empty">
        <Text type="secondary">История событий по сделке отсутствует</Text>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <AntTimeline
        items={events.map(event => {
          const eventConfig = TIMELINE_EVENT_TYPES[event.type];
          return {
            color: eventConfig.color,
            children: (
              <div className="timeline-item">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div className="timeline-header">
                    <Space>
                      <span className="timeline-icon">{eventConfig.icon}</span>
                      <Tag color={eventConfig.color}>{eventConfig.label}</Tag>
                      <Text strong>{event.title}</Text>
                    </Space>
                  </div>
                  {event.description && (
                    <Text type="secondary" className="timeline-description">
                      {event.description}
                    </Text>
                  )}
                  <div className="timeline-footer">
                    <Space split={<span>·</span>}>
                      <Text type="secondary" className="timeline-date">
                        {event.date}
                        {event.time && ` ${event.time}`}
                      </Text>
                      {event.responsible && (
                        <Text type="secondary" className="timeline-responsible">
                          Ответственный: {event.responsible}
                        </Text>
                      )}
                    </Space>
                  </div>
                </Space>
              </div>
            ),
          };
        })}
      />
    </div>
  );
};

export default Timeline;

