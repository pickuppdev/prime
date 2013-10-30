<?php defined('SYSPATH') or die('No direct script access.');
/**
 * Media Controller
 *
 * @author Birkir Gudjonsson (birkir.gudjonsson@gmail.com)
 * @package Prime
 * @category Controller
 * @copyright (c) 2013 SOLID Productions
 */
class Controller_Media extends Controller {

	private $_cache_dir;

	private $cached;

	/**
	 * Serve media files
	 *
	 * @param string filename
	 * @return void
	 */
	public function action_serve()
	{
		// set cache directory
		$this->_cache_dir = APPPATH.'cache/media';

		// get filename
		$filename = $this->request->param('file');

		// pathinfo for filename
		$info = pathinfo($filename);

		// get absolute path to file
		$this->file = Kohana::find_file('media/'.Arr::get($info, 'dirname'), Arr::get($info, 'filename'), Arr::get($info, 'extension'));

		// get file mime type
		$this->mime = File::mime_by_ext(Arr::get($info, 'extension'));

		// check if file does not exist
		if ( ! file_exists($this->file))
		{
			throw HTTP_Exception::factory(404, 'File not found');
		}

		// gzip contents
		$this->gzip();

		// check output
		$output = $this->cached ? $this->cached : $this->file;

		// Set response body and headers
		$this->check_cache(sha1($this->request->uri()).filemtime($output));
		$this->response->body(file_get_contents($output));
		$this->response->headers('content-type', File::mime_by_ext($info['extension']));
		$this->response->headers('last-modified', date('r', filemtime($output)));
	}

	/**
	 * Gzip contents
	 */
	public function gzip()
	{
		$this->cache('.gz', function ($recompile, $read, $write, $response)
		{
			if ( ! Request::current()->accept_encoding())
				return $read;

			// set response header
			$response->headers('content-encoding', 'gzip');

			// check if recompile is needed
			if ($recompile)
			{
				// write contents as gzipped
				$gf = gzopen($write, 'w9');
				gzwrite($gf, file_get_contents($read));
				gzclose($gf);
			}

			return $write;
		});
	}

	/**
	 * Cache specific version of file
	 *
	 * @param string name
	 * @param lambda callback function
	 * @return void
	 */
	public function cache($name, $callback)
	{
		// set cachename
		$readfile = $this->cached ? $this->cached : $this->file;

		// check if cached is set
		if ( ! $this->cached)
		{
			// check if cache dir exists
			if ( ! is_dir($this->_cache_dir))
			{
				// create directory
				if ( ! mkdir($this->_cache_dir, 0777, TRUE))
				{
					throw new Kohana_Exception('Failed to create the media cache directory : :directory', array(
						':directory' => $this->_cache_dir
					));
				}

				// make sure its writable
				chmod($this->_cache_dir, 0777);
			}

			/// set cached filepath
			$this->cached = $this->_cache_dir.'/'.sha1($this->file);
		}

		// check if current file is newer than cache
		$recompile = ( ! file_exists($this->cached) OR (filemtime($this->file) > filemtime($this->cached)));

		// execute the callback with new cache name
		$this->cached = $callback($recompile, $readfile, $this->cached, $this->response);
	}

}