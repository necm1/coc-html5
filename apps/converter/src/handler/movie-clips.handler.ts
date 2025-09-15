import { MovieClip } from '../entity/movie-clip.entity';
import {
  HandlerEventEmitter,
  HandlerEventType,
} from '../handler.event-emitter';
import { Handler, HandlerProps } from '../interface/handler.interface';

export class MovieClipsHandler extends Handler {
  public async canHandle(tag: number): Promise<boolean> {
    return [3, 10, 12, 14, 35, 49].includes(tag);
  }

  public override async handle({
    file,
    tag,
    movieClipsLoaded = 0,
  }: HandlerProps): Promise<void> {
    const reader = file.bufferReader;

    let movieClip;

    if (file.movieClips[movieClipsLoaded]) {
      movieClip = file.movieClips[movieClipsLoaded];
      await movieClip.load(reader, tag);
    } else {
      movieClip = new MovieClip();
      await movieClip.load(reader, tag);
      file.movieClips[movieClipsLoaded] = movieClip;
    }

    HandlerEventEmitter.getInstance().emit('afterHandle', {
      type: HandlerEventType.MOVIE_CLIP_LOADED,
      args: [],
    });
  }
}
