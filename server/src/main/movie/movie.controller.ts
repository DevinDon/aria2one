import { DoubanCrawler, Movie, PiankuCrawler, Tag } from '@iinfinity/movie-crawler';
import { Controller, Inject } from '@rester/core';
import { MovieEntity } from './movie.model';
import { logger } from '@iinfinity/logger';

@Controller()
export class MovieController {

  @Inject() private douban!: DoubanCrawler
  @Inject() private pianku!: PiankuCrawler;

  async getDetail(id: string): Promise<Movie | undefined> {
    const detailInDB = await MovieEntity.findOne({ id });
    // 首先尝试从数据库获取
    if (detailInDB) {
      logger.info(`Movie ${id}: Hit cache from movie`);
      return detailInDB;
    }
    // 如果数据库不存在，尝试爬取
    logger.info(`Movie ${id}: Crawler working for movie`);
    const detailFromDouban = await this.douban.movie(id)
      .catch(e => (logger.info(`Movie ${id}: Fetch failed from Douban`), undefined));
    const detailFromPianku = await this.pianku.movieByID(id)
      .catch(e => (logger.info(`Movie ${id}: Fetch failed from Pianku`), undefined));
    // 如果爬到了 片库 的下载资源，合并
    if (detailFromPianku) {
      const detail = Object.assign<any, Movie | undefined, Pick<Movie, 'downloads' | 'links'>>(
        {},
        detailFromDouban,
        { downloads: detailFromPianku.downloads, links: detailFromPianku.links }
      );
      MovieEntity.update({ id }, detail)
        .then(v => {
          if (v.affected) {
            logger.info(`Movie ${id}: Update movie with downloads`);
          } else {
            MovieEntity.insert(detail)
              .then(v => logger.info(`Movie ${id}: Insert movie with downloads`));
          }
        });
      return detail;
    }
    // 否则只返回豆瓣的
    if (detailFromDouban) {
      MovieEntity.update({ id }, detailFromDouban)
        .then(v => {
          if (v.affected) {
            logger.info(`Movie ${id}: Update movie without downloads`);
          } else {
            MovieEntity.insert(detailFromDouban)
              .then(v => logger.info(`Movie ${id}: Insert movie without downloads`));
          }
        });
    }
    return detailFromDouban;
  }

  async getSuggest(tag: Tag = '热门', start: number = 0, limit: number = 10) {
    const results = await this.douban.suggest(tag, start, limit);
    const works = results.map(v => this.getDetail(v.id));
    return results;
  }

}
